import { Readable } from "svelte/motion";
import { derived, Writable, writable } from "svelte/store";
import { version } from "../../../../package.json";
import { serialize } from "../serialize";
import { asStore } from "../store_owner";
import Resource from "../structs/resource";


const defaultGameSettings = {
    title: "your game's name here",
    LICENSE: "No license specified.",
}

export type GameSettings = typeof defaultGameSettings

export const gameData: Writable<GameData|null> = writable(null);

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

        asStore(this.resources).subscribe((value) => this.resources = value); // keep synced with the store
        asStore(this.settings).subscribe((value) => this.settings = value);
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
        asStore(this.resources).update(x => x) // triggers reactivity
    }

    addResource(resource: Resource) {
        if(this.resources.has(resource.uuid)) {
            throw Error(`Resource with uuid ${resource.uuid} is already registered.`)
        }

        this.resources.set(resource.uuid, resource);
        asStore(this.resources).update(x => x) // triggers reactivity
    }

    getAllOfResourceType<T extends typeof Resource>(type: T): InstanceType<T>[] {
        return Array.from(this.resources.values()).filter(x => x instanceof type) as InstanceType<T>[];
    }

    getResourceTypeStore<T extends typeof Resource>(type: T): Readable<InstanceType<T>[]> {
        return derived(asStore(this.resources), _ => this.getAllOfResourceType(type));
    }
    
    serialized() {
        return serialize(this);
    }
}