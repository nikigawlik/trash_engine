import { writable } from "svelte/store";
import { db, deserialize, getDocumentGameData, requestAsync, serialize, STORE_NAME_RESOURCES } from "../database";
import Folder from "../structs/folder";
import Resource from "../structs/resource";
import Room from "../structs/room";
import Sprite from "../structs/sprite";
import { assert } from "./utils";

console.log("resource_manager.ts loading")

const defaultSettings = {
    title: "your game's name here",
}

const saveVersion = 1;
interface SaveData {
    root: Folder,
    settings: typeof defaultSettings,
    version: typeof saveVersion,
}

// /** @type {ResourceManager} */ export let resourceManager;

export default class ResourceManager {
    root: Folder;
    settings: typeof defaultSettings;
    cache: any;
    constructor() {
        this.root = new Folder("root", this, 
            [
                new Folder("sprites", this, [], Sprite),
                new Folder("rooms", this, [], Room),
            ]
        );
        this.settings = defaultSettings;
        this.cache = {};
    }

    static async init() {
        console.log("resource manager init...")
    }

    addResource(folderName: string, resource: Resource) {
        let folder: Folder = this.root.contents.find(x => x.name == folderName) as Folder;
        folder.add(resource);
    }

    addSprite(sprite: Sprite) { this.addResource("sprites", sprite); }
    // addThing(thing) { this.addResource("things", thing); }
    addRoom(room: Room) { this.addResource("rooms", room); }

    getAllOfResourceType(type: typeof Resource) {
        let folder: Folder = this.root.contents.find(x => (x instanceof Folder) && x.resourceType == type) as Folder;
        let resources = Array.from(folder.iterateAllResources());
        return resources;
    }

    toJSON() {
        return this.root;
    }

    findByUUIDInFolder(uuid: string, folderName: string) {
        let folder = this.root.contents.find(x => x.name == folderName) as Folder;
        let result = folder.findByUUID(uuid);
        if(!result) return null;
        else return result;
    }

    findByUUID(uuid: string) {
        const cached = this.cache[uuid];
        if(cached) {
            return cached;
        } else {
            const resource = this.root.findByUUID(uuid);
            if(resource) this.cache[uuid] = resource;
            return resource
        }
    }

    // render() {
    //     let elmt = html`
    //         <${Card} name=resources class=resources>
    //         <//>
    //     `;
    //     this.resourceWindowElmt = elmt;
    //     this.refresh();
    //     return elmt;
    // }

    refresh() {
        // if(!this.resourceWindowElmt) return;
        // this.resourceWindowElmt.querySelector("ul.resources")?.remove();
        // this.resourceWindowElmt.querySelector("div.scroll-box")
        //     .append(resourceList(this.root.contents));
        // elementsRegister(this.resourceWindowElmt.querySelector("ul.resources"));
        update(x => x);
    }

    async getSerializedData() {
        let data: SaveData = {
            version: saveVersion,
            root: this.root,
            settings: this.settings,
        }
        
        return await serialize(data);
    }

    async setFromSerializedData(data: any) {
        // console.log(result);   
        data = await deserialize(data);
        console.log(`- resources loaded`)
        console.log(data); 

        if(!data.version) {
            // pre-versioning
            this.root = data;  
        } else if(data.version == 1) {
            const d: SaveData = data; // just for typescript checking
            this.root = d.root;
            this.settings = d.settings;
        }

        let postProcess = (obj: any, parent: Folder | null) => {
            if(obj instanceof Resource) {
                obj._parent = parent;
                obj._resourceManager = this;
                if(obj instanceof Folder) {
                    for(let child of obj.contents) {
                        postProcess(child, obj);
                    }
                }
            }
        }
        postProcess(this.root, null);
        this.cache = {};
        this.refresh();
    }

    async save(replaceKey?: number) {
        if(!db || !db.transaction) return;
        
        // we just need to save the root, actually
        // let rootClone = JSON.parse(JSON.stringify(this, replacer));
        let rootClone = await this.getSerializedData();

        let trans = db.transaction([STORE_NAME_RESOURCES], "readwrite");
        let objectStore = trans.objectStore(STORE_NAME_RESOURCES);

        let request = replaceKey != undefined? objectStore.put(rootClone, replaceKey) : objectStore.put(rootClone);
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
            // throw Error("Database not initialized!")
            console.log("no database...")
            return;
        }

        let result;

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
