console.log("database.ts loading")

const VERSION = 2;
const NAME = "ngine_Database"

export const STORE_NAME_RESOURCES = "resources";
export const STORE_NAME_GLOBAL_DATA = "global_data";

let constructors: Map<string, {new (): Object}> = new Map();
let inverseConstructors: Map<{new (): Object}, string> = new Map();

// database object
export let db: IDBDatabase;

export async function init(constructorMap?: Map<string, {new (): Object}>) {
    if(constructorMap) {
        constructors = constructorMap;

        // set up the inverse map
        inverseConstructors.clear();
        for(let name of constructorMap.keys()) {
            let constr = constructorMap.get(name);
            inverseConstructors.set(constr, name);
        }
    }

    console.log("opening database...");
    if (!window.indexedDB) {
        console.log("Your browser doesn't support a stable version of IndexedDB. Damn.");
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

export function getDocumentGameData() : string | null {
    return document.head.querySelector(`script[type="gamedata"]`)?.textContent.trim();
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
            _func: inverseConstructors.get(obj)
        };
    }

    // the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;

    // canvas
    if(obj instanceof HTMLCanvasElement) {
        // let blob = await new Promise(resolve => obj.toBlob(resolve, "image/png"));
        // return blob;
        return {
            _imageURL: obj.toDataURL("image/png")
        }
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

        if(inverseConstructors.has(obj.constructor)) {    
            copy._type = inverseConstructors.get(obj.constructor);
        }
        else if(obj.constructor != Object) {
            let recogTypes = Array.from(inverseConstructors.keys()).map(x => x.name);
            throw new UnrecognizedTypeError(`Unknown type: ${obj.constructor.name}. Recognized types: [${recogTypes.join(", ")}]`);
        }

        return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
}

class UnrecognizedTypeError extends Error {
    constructor(message) {
      super(message);
      this.name = 'UnrecognizedTypeError';
    }
}


// TODO refactor -> either inline or make a separate funtion for the equivalent code in serialize
function makeUnrecognizedTypeError(typeName) {
    let recogTypes = Array.from(constructors.keys());
    return new UnrecognizedTypeError(`Unknown type: ${typeName}. Recognized types: ${recogTypes.join(", ")}`);
}

export async function deserialize(obj: any | null, additionalProperties: WeakMap<object, object>) {
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
            copy[i] = await deserialize(obj[i], additionalProperties);
        }
        return copy;
    }

    // object
    if (obj instanceof Object) {
        if(obj._func) {
            // reference to a known type/function
            if(!constructors.has(obj._func)) throw makeUnrecognizedTypeError(obj._func);

            return constructors.get(obj._func);
        } else if(obj._imageURL) {
            // from image data url
            let img = new Image();
            let promise = new Promise(resolve => img.onload = resolve);
            img.src = obj._imageURL;
            await promise;
            let canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            let ctx = canvas.getContext("2d");
            if(ctx) ctx.drawImage(img, 0, 0);

            return canvas;
        } else {
            if(obj._type) {
                if(!constructors.has(obj._type)) throw makeUnrecognizedTypeError(obj._type);

                let constructor = constructors.get(obj._type);
                // object of a known type/function
                copy = new constructor();
                
                for (var attr in obj) {
                    if (obj.hasOwnProperty(attr) && attr[0] != "_") {
                        // for defined types the property needs to already exist
                        if(copy.hasOwnProperty(attr))
                            copy[attr] = await deserialize(obj[attr], additionalProperties);
                        else {
                            // remember for data transform stuff
                            if(!additionalProperties.has(copy)) additionalProperties.set(copy, {});
                            additionalProperties.get(copy)[attr] = await deserialize(obj[attr], additionalProperties);
                        }
                    }
                }
            } else {
                // other/unknown object
                copy = {};
                for (var attr in obj) {
                    if (obj.hasOwnProperty(attr) && attr[0] != "_")
                        copy[attr] = await deserialize(obj[attr], additionalProperties);
                }
            }
        }
        return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
}

// export function deepClone(obj: any) {
//     return deserialize(serialize(obj));
// }


export function requestAsync(request: IDBRequest<any[]>): Promise<any[]> {
    return new Promise((resolve, reject) => { 
        request.onsuccess = (e): void => resolve(request.result); 
        request.onerror = (e): void => reject(request.error); 
    })
}