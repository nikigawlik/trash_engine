console.log("database.ts loading")

const VERSION = 2;
const NAME = "ngine_Database"

export const STORE_NAME_RESOURCES = "resources";
export const STORE_NAME_GLOBAL_DATA = "global_data";

let constructors: any = {};

// database object
export let db: IDBDatabase;

export async function init(additionalConstructors: Function[] = []) {
    for(let s of additionalConstructors) {
        constructors[s.name] = s;
    }

    console.log("opening database...");
    if (!window.indexedDB) {
        console.log("Your browser doesn't support a stable version of IndexedDB. Such and such feature will not be available.");
        return;
    }
    
    let request = window.indexedDB.open(NAME, VERSION);

    let upgradePromise: null | Promise<void> = null;
    
    db = await new Promise((resolve, reject) => {
        request.onsuccess = event => {
            resolve(request.result);     
        }
        request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
            upgradePromise = upgrade(request.result, event.oldVersion, event.newVersion);
            // (this doesn't resolve or reject, if successful it will trigger onsuccess)
        }
        request.onblocked = event => {
            reject("database opening blocked");
        }
        request.onerror = event => {
            reject("database opening error " + request.error?.code);
        }
    });

    if(upgradePromise) await upgradePromise; // wait for this too

    console.log(".");

    // let trans = db.transaction([STORE_NAME_RESOURCES, "readonly"]);

}

async function upgrade(database: IDBDatabase, fromVersion: number, toVersion: number | null) {
    console.log(`Upgrading database: v${fromVersion} --> v${toVersion}`);
    let currentVersion = fromVersion;
    // continuously update
    while(currentVersion != toVersion) {
        switch(currentVersion) {
            case 0: // 0 --> 1  ===  creation of the database
                console.log(`--   0 --> 1`);
                let resources = database.createObjectStore(STORE_NAME_RESOURCES, { autoIncrement: true });
                // await new Promise((resolve, reject) => { 
                    //     resolve = resources.transaction.oncomplete;
                    //     reject = event => resources.transaction.onerror(event.target.error)
                    // });
                    currentVersion = 1;
                    break;
            case 1: // 1 --> 2
                console.log(`--   1 --> 2`);
                let globalData = database.createObjectStore(STORE_NAME_GLOBAL_DATA, { autoIncrement: true });
                // await new Promise((resolve, reject) => { 
                //     resolve = globalData.transaction.oncomplete;
                //     reject = event => resources.transaction.onerror(event.target.error)
                // });
                currentVersion = 2;
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
            request.onsuccess = event => { console.log("success"); resolve(request.error); } 
            request.onerror = event => { console.log("error"); reject(request.error); } 
            request.onblocked = event => { resolve("database deletion blocked, will be deleted on reload"); }
            request.onupgradeneeded = () => { resolve("upgrade triggered")};
        });
        console.log(result);
        location.reload();

    } catch (e) {
        console.error(e);
    }
}


// is used to create clean copy before storing in db
export async function serialize(obj: any | null) {
    var copy : any;

    // function
    if(typeof obj === "function") {
        return {
            _func: obj.name
        };
    }

    // the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;

    // canvas
    if(obj instanceof HTMLCanvasElement) {
        let blob = await new Promise(resolve => obj.toBlob(resolve, "image/png"));
        return blob;
    }

    // array
    if(obj instanceof Array) {
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

export async function deserialize(obj: any | null) {
    var copy : any;

    // the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return await obj;

    // image -> canvas
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
            if(ctx) ctx.drawImage(img, 0, 0);

            return canvas;
        }
    }

    // array
    if (obj instanceof Array) {
        copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = await deserialize(obj[i]);
        }
        return copy;
    }

    // object
    if (obj instanceof Object) {
        if(obj._func && constructors[obj._func]) {
            // reference to a known type/function
            return constructors[obj._func];
        } else {
            let constructor = constructors[obj._type]; // Can be undefined!
            if(constructor) {
                // object of a known type/function
                copy = new constructors[obj._type]();
            } else {
                // other/unknown object
                copy = {};
            }
            for (var attr in obj) {
                if ((obj.hasOwnProperty(attr) && attr[0] != "_") 
                && (!constructor || copy.hasOwnProperty(attr))) // for constructors the property needs to already exist
                    copy[attr] = await deserialize(obj[attr]);
            }
        }
        return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
}

export function deepClone(obj: any) {
    return deserialize(serialize(obj));
}


export function requestAsync(request: IDBRequest<any[]>): Promise<any[]> {
    return new Promise((resolve, reject) => { 
        request.onsuccess = (e): void => resolve(request.result); 
        request.onerror = (e): void => reject(request.error); 
    })
}