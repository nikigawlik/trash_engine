import { Folder, Room } from "./resource_manager.mjs";
import { Sprite } from "./sprite_editor.mjs";

const VERSION = 1;
const NAME = "ngine_Database"

// database object
/** @type {IDBDatabase} */
export let db;

export async function init() {
    console.log("opening database...");
    if (!window.indexedDB) {
        console.log("Your browser doesn't support a stable version of IndexedDB. Such and such feature will not be available.");
    }
    
    let request = window.indexedDB.open(NAME, VERSION);
    
    db = await new Promise((resolve, reject) => {
        request.onsuccess = event => {
            resolve(event.target.result);     
        }
        /** @param {IDBVersionChangeEvent} event */
        request.onupgradeneeded = event => {
            upgrade(event.target.result, event.oldVersion, event.newVersion)
            // (this doesn't resolve or reject, if successful it will trigger onsuccess)
        }
        request.onblocked = event => {
            reject("database opening blocked");
        }
        request.onerror = event => {
            reject("database opening error" + event.target.errorCode);
        }
    });

    // let trans = db.transaction(["resources", "readonly"]);

}

async function upgrade(database, fromVersion, toVersion) {
    console.log(`Upgrading database: v${fromVersion} --> v${toVersion}`);
    let currentVersion = fromVersion;
    // continuously update
    while(currentVersion != toVersion) {
        console.log(`--- v${fromVersion} -> v${toVersion}`);
        switch(currentVersion) {
            case 0: // 0 --> 1  ===  creation of the database
                let resources = database.createObjectStore("resources", { autoIncrement: true });
                await new Promise(resolve => resolve = resources.transaction.oncomplete);
                currentVersion = 1;
                break;
            default:
                throw new Error(`No implementation for database version ${currentVersion}`);
        }
    }
}


export async function deleteDatabase() {
    try{
        // small documentation:
        // firefox will not delete immediately, it calls blocked event and deletes later 
        // on site reload (or when all connections are broken probably)
        // when another attempt is made it will just do nothing (not even call the blocked event)

        console.log(`try deleting database "${NAME}"...`)
        let request = indexedDB.deleteDatabase(NAME);
        let result = await new Promise((resolve, reject) => { 
            request.onsuccess = event => { console.log("success"); resolve(event.target.error); } 
            request.onerror = event => { console.log("error"); reject(event.target.error); } 
            request.onblocked = event => { console.log("database deletion blocked, will be deleted on reload"); resolve(); }
            request.onupgradeneeded = () => {console.log("upgrade triggered"); resolve()};
        });
        console.log(result);
        location.reload();

    } catch (e) {
        console.error(e);
    }
}


// is used to create clean copy before storing in db
export async function serialize(obj) {
    var copy;

    // the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;

    // Folder

    // Sprite

    // Room

    // canvas
    if(obj instanceof HTMLCanvasElement) {
        let blob = await new Promise(resolve => obj.toBlob(resolve, "image/png"));
        // copy = {
        //     // width: obj.width,
        //     // height: obj.height,
        //     blob: blob,
        //     _origType: "HTMLCanvasElement",
        // }
        return blob;
    }

    // array
    if (obj instanceof Array) {
        copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = await serialize(obj[i]);
        }
        return copy;
    }

    // object
    if (obj instanceof Object) {
        copy = {};
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr) && attr[0] != "_") 
                copy[attr] = await serialize(obj[attr]);
        }
        copy._type = obj.constructor?.name;
        return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
}

let serializables = [Folder, Sprite, Room];
let constructors = {};
for(let s of serializables) {
    constructors[s.name] = s;
}

export async function deserialize(obj) {
    var copy;

    // the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return await obj;

    // sprite
    if(obj instanceof Blob) {
        if(obj.type == "image/png") {
            let img = new Image();
            let promise = new Promise(resolve => img.onload = resolve);
            img.src = URL.createObjectURL(obj);
            await promise;
            let canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            let ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);

            return await canvas;
        }
    }

    // array
    if (obj instanceof Array) {
        copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = await deserialize(obj[i]);
        }
        return await copy;
    }

    // object
    if (obj instanceof Object) {
        if(constructors[obj._type]) {
            copy = new constructors[obj._type]();
        } else {
            copy = {};
        }
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr) && attr[0] != "_") 
                copy[attr] = await deserialize(obj[attr]);
        }
        return await copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
}


export function requestPromise(request) {
    return new Promise((resolve, reject) => { 
        request.onsuccess = e => resolve(e.target.result); 
        request.onerror = e => reject(e.target.error); 
    })
}