import { Writable, writable } from "svelte/store";
import { db, deserialize, getDocumentGameData, requestAsync, serialize, STORE_NAME_RESOURCES } from "../database";
import type Folder from "../structs/folder";
import type Resource from "../structs/resource";
import Room from "../structs/room";
import Sprite from "../structs/sprite";
import Behaviour from "../structs/behaviour";
import { assert, rectInside } from "./utils";

console.log("resource_manager.ts loading")

const defaultSettings = {
    title: "your game's name here",
}

const saveVersion = 4;
interface SaveData {
    resources: Resource[]
    settings: typeof defaultSettings,
    version: typeof saveVersion,
}

// /** @type {ResourceManager} */ export let resourceManager;

export default class ResourceManager {
    settings: typeof defaultSettings;
    stores: WeakMap<Resource, Writable<Resource>> // TODO weak map -> needs symbol
    resources: Map<string, Resource>
    constructor() {
        this.settings = defaultSettings;
        this.stores = new Map();
        this.resources = new Map();
    }

    static async init() {
        console.log("resource manager init...")
    }

    addResource<T extends Resource>(resource: T) { 
        this.resources.set(resource.uuid, resource);
    }

    getResourceOfType(uuid: string, type: typeof Resource): Resource | null {
        let r = this.resources.get(uuid);
        if(r instanceof type)
            return r;
        else
            return null;
    }

    getResource(uuid: string) {
        return this.resources.get(uuid) || null;
    }

    deleteResource(uuid: string) {
        this.resources.delete(uuid);
    }

    // expensive-ish
    moveResource(resourceUUID: string, beforeResourceUUID: string) {
        let r1 = this.getResource(resourceUUID);
        let r2 = this.getResource(beforeResourceUUID);
        
        if(!(r1 && r2)) return false;

        let resources = Array.from(this.resources.values());
        
        let removeIndex = resources.findIndex(x => x.uuid == resourceUUID);
        resources.splice(removeIndex, 1);

        let insertIndex = resources.findIndex(x => x.uuid == beforeResourceUUID);
        resources.splice(insertIndex, 0, this.resources.get(resourceUUID));

        this.resources.clear();
        for(let res of resources) {
            this.resources.set(res.uuid, res);
        }

        // this.stores.get(resourceUUID)?.update(x=>x);
        // this.stores.get(beforeResourceUUID)?.update(x=>x);

        return true;
    }

    getAllOfResourceType(type: typeof Resource): Resource[] {
        return Array.from(this.resources.values()).filter(x => x instanceof type);
    }

    getRooms(): Room[] {
        return this.getAllOfResourceType(Room) as Room[];
    }

    getSprites(): Sprite[] {
        return this.getAllOfResourceType(Sprite) as Sprite[];
    }

    getBehaviours(): Behaviour[] {
        return this.getAllOfResourceType(Behaviour) as Behaviour[];
    }

    getResourceStore(resource: Resource|string): Writable<Resource> | null {
        if(typeof resource == "string") resource = this.getResource(resource);
        
        if(this.stores.has(resource)) return this.stores.get(resource);
        
        if(!resource) return null;
        
        let store = writable(resource);

        store.subscribe(value => {
            if(value != resource) {
                throw Error("You can only modify, not set/change the resource using a store.")
            } 

            //always also triggers a general update (should maybe be refactored out eventually)
            this.refresh();
        });

        this.stores.set(resource, store);
        return store;
    }

    refresh() {
        update(x => x);
    }

    async getSerializedData() {
        let data: SaveData = {
            version: saveVersion,
            resources: Array.from(this.resources.values()),
            settings: this.settings,
        }
        
        return await serialize(data);
    }

    async setFromSerializedData(data: any) {
        // console.log(result);   
        let additionalProperties = new WeakMap<any, any>();
        data = await deserialize(data, additionalProperties);
        console.log(`- resources loaded`)
        console.log(data);

        let setResourcesFromLegacyFolder = (root: Folder) => {
            this.resources.clear();
            for(let res of root.iterateAllResources()) {
                this.resources.set(res.uuid, res)
            }
        }

        if(!data.version) {
            // pre-versioning
            setResourcesFromLegacyFolder(data);
        } else if(data.version == 1) {
            const d: { 
                root: Folder
                settings: typeof defaultSettings
                version: typeof saveVersion
            } = data;

            setResourcesFromLegacyFolder(d.root);
            this.settings = d.settings;
        } else if(data.version == 2) {
            const d: SaveData = data;
            this.resources.clear();
            for(let res of d.resources) {
                this.resources.set(res.uuid, res)
            }
            this.settings = d.settings;
        } else if(data.version == 3) {
            const d: SaveData = data;
            this.resources.clear();
            for(let res of d.resources) {
                this.resources.set(res.uuid, res)
            }
            for(let res of d.resources) {
                // undo sprite/bahaviour fuckery
                if(res instanceof Sprite && additionalProperties.has(res)) {
                    let bIDs: string[] = additionalProperties.get(res).behaviourIDs;
                    for(let bID of bIDs) {
                        // move the behavior back into the sprite
                        let behaviour = this.resources.get(bID) as Behaviour;
                        res.behaviours.push(behaviour);
                        this.resources.delete(bID);
                    }
                }
            }
            this.settings = d.settings;
        } else if(data.version == 4) {
            const d: SaveData = data;
            this.resources.clear();
            for(let res of d.resources) {
                this.resources.set(res.uuid, res)
            }
            this.settings = d.settings;
        }
        else{
            console.error(`Unrecognized version ${data.version}`);
            return;
        }

        this.refresh();
    }

    async save(replaceKey?: number) {
        if(!db || !db.transaction) return;
        
        let dataObject = await this.getSerializedData();

        let trans = db.transaction([STORE_NAME_RESOURCES], "readwrite");
        let objectStore = trans.objectStore(STORE_NAME_RESOURCES);

        let request = replaceKey != undefined? objectStore.put(dataObject, replaceKey) : objectStore.put(dataObject);
        request.onsuccess = event => {
            // event.target.result === customer.ssn;
            console.log(`saved resource ${request.result}`);
        };

        await new Promise((resolve, reject) => { 
            trans.oncomplete = e => { console.log("transaction done"); resolve(e); } 
            trans.onerror = e => reject(request.error); 
        });
    }

    async load(customData? : string, customKey? : any) {
        if(!db || !db.transaction) {
            console.log("no database...")
            return;
        }

        let result: any;

        if(customData) {
            result = JSON.parse(customData);
        } else {
            console.log(`- load resource tree from indexed db...`)
            try {
                if(customKey == undefined) {
                    let results = await ResourceManager.getSaveFiles();
                    result = results[results.length - 1].value;
                } else {
                    let trans = db.transaction(STORE_NAME_RESOURCES, "readonly");
                    let objectStore = trans.objectStore(STORE_NAME_RESOURCES);

                    result = await requestAsync(objectStore.get(customKey));
                }
            } catch (e) {
                console.log(`getting data failed: ${(e as Error)?.message}`);
                result = null;
            }
        }

        if(!result) {
            let docData = getDocumentGameData();
            if(docData) {
                result = JSON.parse(docData);
            }
        }

        if(result) {
            try {
                await this.setFromSerializedData(result);
            } catch(e) {
                console.log("!! save data potentially corrupted, loading failed")
            }
        } else {
            console.log("!! no save data found")
        }
    }

    public static async getSaveFiles(): Promise<{key:any, value:any}[]> {
        let trans = db.transaction(STORE_NAME_RESOURCES, "readonly");
        let objectStore = trans.objectStore(STORE_NAME_RESOURCES);

        let pKeys = requestAsync(objectStore.getAllKeys());
        let pValues = requestAsync(objectStore.getAll());
        
        let [keys, values] = await Promise.all([pKeys, pValues]);
        assert(keys.length == values.length);
        let results: {key:any, value:any}[] = keys.map((_, i:number) => ({
            key: keys[i],
            value: values[i],
        }))
        return results;
    }
}


let _value = new ResourceManager();
let {subscribe, set, update } = writable(_value);
subscribe(x => _value = x);
update(x => x)

let isLoadedPromise = _value.load();

// TODO we should get rid of this
export let resourceManager = {
    subscribe,
    get: () => _value,
    set: value => {
        if(value != _value) 
            throw new Error("When accessing the resourceManager object store, you are not allowed to change the instance of the manager, only change it's contents.")
        set(value);
    },
    waitForLoad: () => isLoadedPromise,
}
