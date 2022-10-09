import { writable } from "svelte/store";
import { db, deserialize, getDocumentGameData, requestAsync, serialize, STORE_NAME_RESOURCES } from "../database";
import Folder from "../structs/folder";
import Resource from "../structs/resource";
import Room from "../structs/room";
import Sprite from "../structs/sprite";

console.log("resource_manager.ts loading")

// /** @type {ResourceManager} */ export let resourceManager;

export default class ResourceManager {
    root: Folder;
    cache: any;
    constructor() {
        this.root = new Folder("root", this, 
            [
                new Folder("sprites", this, [], Sprite),
                new Folder("rooms", this, [], Room),
            ]
        );
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
        return await serialize(this.root);
    }

    async setFromSerializedData(data: any) {
        // console.log(result);   
        data = await deserialize(data);
        console.log(`- resources loaded`)
        console.log(data); 
        this.root = data;  

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

    async save() {
        if(!db || !db.transaction) return;
        
        // we just need to save the root, actually
        // let rootClone = JSON.parse(JSON.stringify(this, replacer));
        let rootClone = await this.getSerializedData();

        let trans = db.transaction([STORE_NAME_RESOURCES], "readwrite");
        let objectStore = trans.objectStore(STORE_NAME_RESOURCES);
        let request = objectStore.put(rootClone);
        request.onsuccess = event => {
            // event.target.result === customer.ssn;
            console.log(`saved resource ${request.result}`);
        };

        await new Promise((resolve, reject) => { 
            trans.oncomplete = e => { console.log("transaction done"); resolve(e); } 
            trans.onerror = e => reject(request.error); 
        });
    }

    async load() {
        if(!db || !db.transaction) {
            // throw Error("Database not initialized!")
            console.log("no database...")
            return;
        }
        console.log(`- load resource tree...`)
        let trans = db.transaction(STORE_NAME_RESOURCES, "readonly");
        let objectStore = trans.objectStore(STORE_NAME_RESOURCES);
        let results = await requestAsync(objectStore.getAll());
        let result = results[results.length - 1];

        if(!result) {
            let docData = getDocumentGameData();
            if(docData) {
                result = JSON.parse(docData);
            }
        }

        if(result) {
            await this.setFromSerializedData(result);
        } else {
            console.log("!! no save data found")
        }
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
    waitForLoad: () => isLoadedPromise,
}
