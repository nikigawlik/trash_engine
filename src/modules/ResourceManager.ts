import { writable } from "svelte/store";
import { db, deserialize, requestAsync, serialize, STORE_NAME_RESOURCES } from "./database";
import Folder from "./structs/folder";
import Resource from "./structs/resource";
import Room from "./structs/room";
import Sprite from "./structs/sprite";

console.log("resource_manager.ts loading")

// /** @type {ResourceManager} */ export let resourceManager;

export default class ResourceManager {
    root: Folder;
    constructor() {
        this.root = new Folder("root", this, 
            [
                new Folder("sprites", this, [], Sprite),
                new Folder("rooms", this, [], Room),
            ]
        );
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
        return this.root.findByUUID(uuid);
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

    async save() {
        if(!db || !db.transaction) return;
        
        // we just need to save the root, actually
        // let rootClone = JSON.parse(JSON.stringify(this, replacer));
        let rootClone = await serialize(this.root);
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
        if(!db || !db.transaction) return;
        console.log(`- load resource tree...`)
        let trans = db.transaction(STORE_NAME_RESOURCES, "readonly");
        let objectStore = trans.objectStore(STORE_NAME_RESOURCES);
        let results = await requestAsync(objectStore.getAll());
        let result = results[results.length - 1];
        
        if(result) {       
            // console.log(result);   
            result = await deserialize(result);
            console.log(`- resources loaded`)
            console.log(result); 
            this.root = result;  

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
            this.refresh();
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


// // helper html generator, not a component generator function!
// let resourceList = (resources) => {
//     return html`
//     <ul class=resources>
//         ${resources.map(x => html`
//             <li>
//                 <${ResourceSubtree} subtree=${x.contents} name=${x.name} self=${x}><//>
//             </li>
//         `)}
//     </ul>
//     `;
// }

// let ResourceSubtree = (attrs = {}, ...children) => {
//     let subtree = attrs.subtree;
//     let elmt;
//     if(attrs.self.type == "folder") {
//         let e1 = attrs.self.render();
//         let e2 = html`
//             <ul>
//                 ${subtree.map(x => html`
//                 <li>
//                     <${ResourceSubtree} subtree=${x.contents} name=${x.name} self=${x}><//>
//                 </li>
//                 `)}
//             </ul>
//         `;
//         console.log(data.editor.settings.subFolders)
//         elmt = data.editor.settings.subFolders? 
//             html`
//                 <${Details} summary=${e1} open=true>
//                     ${e2}
//                 <//>
//             `
//         :
//             html`
//                 ${e1}
//                 ${e2}
//             `
//         ;

//     } else {
//         elmt = attrs.self.render();
//     }
//     return elmt;
// }

// let Details = (attrs = { summary: "", open: true }, ...children) => {
//     return html`
//         <details open=${attrs.open}>
//             <summary>${attrs.summary}</summary>
//             ${children.map(x => html`${x}`)}
//         </details>
//     `;
// }