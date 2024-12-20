import { Readable } from "svelte/motion";
import { derived, Writable, writable } from "svelte/store";
import { version } from "../../../../package.json";
import { clearDBGameData, db, saveToDB } from "../database";
import { serialize } from "../serialize";
import { asStore, storeRegistered } from "../store_owner";
import Resource from "../structs/resource";
import { compareBy } from "./utils";


const defaultGameSettings = {
    title: "your game's name here",
    LICENSE: "No license specified.",
}

export type GameSettings = typeof defaultGameSettings

export const gameData: Writable<GameData|null> = writable(null);
gameData.subscribe(gd => {
    if(gd == null) return

    clearDBGameData()

    asStore(gd.resources, "gameData.resources").subscribe((value) => gd.resources = value); // keep synced with the store
    asStore(gd.settings, "gameData.settings").subscribe((value) => gd.settings = value);

    if(db) {
        asStore(gd.settings).subscribe(value => saveToDB(".settings", value) ) // async!!
        saveToDB(".engineVersion", gd.engineVersion ) // async!!
        asStore(gd.resources).subscribe(value => {
            if(db) {
                // slighlty wasteful to do it for all of them, but ok
                // also just seems sketchy tbh...
                for(let [uuid, resource] of gd.resources) {
                    if(!storeRegistered(resource))
                        asStore(resource).subscribe(value => saveToDB(uuid, value)) // async!
                }
            }
        })
    }
})

/**
 * this class essentially stores data in the way they are exported to json.
 * It is agnostic to the environment (game, engine, other)
 */
export default class GameData implements GameData{
    engineVersion: string
    resources: Map<string, Resource>
    settings: GameSettings

    constructor() {
        this.resources = new Map();
        this.engineVersion = version;
        this.settings = { ...defaultGameSettings }
    }

    hasResource(uuid: string) {
        return this.resources.has(uuid);
    }

    getResource<T extends typeof Resource>(uuid: string, type?: T): InstanceType<T> {
        if(this.resources.has(uuid)) {
            let r = this.resources.get(uuid);
            if(!type) 
                return r as InstanceType<T>;
            else
                return (r instanceof type)? (r as InstanceType<T>) : null;
        } else {
            return null;
        }
    }

    deleteResource(uuid: string) {
        this.resources.delete(uuid);
        asStore(this.resources, "gameData.resources").update(x => x) // triggers reactivity
    }

    addResource(resource: Resource) {
        if(this.resources.has(resource.uuid)) {
            throw Error(`Resource with uuid ${resource.uuid} is already registered.`)
        }

        const maxOrdinal = Math.max(...Array.from(this.resources.values()).map(obj => obj.ordinal));
        resource.ordinal = maxOrdinal+1;

        this.resources.set(resource.uuid, resource);
        asStore(this.resources, "gameData.resources").update(x => x) // triggers reactivity
    }

    moveResource(uuid: string, referenceUUID: string, pos: "before"|"after") {
        let inserted = this.getResource(uuid);
        let ref = this.getResource(referenceUUID);
        // move the ordinals of all later resources by one to make space
        for(let r of this.resources.values()) {
            if(r.ordinal > ref.ordinal) {
                r.ordinal ++;
            }
        }
        if(pos == "before") {
            // insert before -> new resource takes the place of ref, ref moves one back
            inserted.ordinal = ref.ordinal;
            ref.ordinal = inserted.ordinal + 1;
        }
        else {
            // insert after -> new resource is after the ref
            inserted.ordinal = ref.ordinal + 1;
        }

        asStore(this.resources, "gameData.resources").update(x => x) // triggers reactivity
    }

    getAllOfResourceType<T extends typeof Resource>(type: T): InstanceType<T>[] {
        return Array.from(this.resources.values())
            .filter(x => x instanceof type)
            .sort(compareBy(x => x.ordinal)) as InstanceType<T>[];
    }

    getResourceTypeStore<T extends typeof Resource>(type: T): Readable<InstanceType<T>[]> {
        return derived(asStore(this.resources, "gameData.resources"), _ => this.getAllOfResourceType(type));
    }
    
    serialized() {
        return serialize(this);
    }
}