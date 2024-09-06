import { serialize } from "./serialize";

console.log("database.ts loading")

const VERSION = 3;
const NAME = "trash_engine";
// const NAME = "ngine_Database"; // old name

export const STORE_NAME_SAVES = "game_data";
export const STORE_NAME_GLOBAL_DATA = "global_data";
export const STORE_NAME_RESOURCES = `resources`

// database object
export let db: IDBDatabase | null;
let _inGame: boolean;

export class NoDatabaseError extends Error {
    constructor() {
        super("A database could not be established, this could be due to incognito/private mode, browser privacy settings, or storage limitations.")
    }
}

export async function init(inGame = false) {
    _inGame = inGame;
    try {
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
                // reject("lol")
                reject(request.error)
            }
        });

        if (upgradePromise) await upgradePromise; // wait for this too

        console.log(".");
    } catch (e) {
        console.log("Could not open database. Possible reasons: user settings, incognito/private mode, browser support, etc.")
        console.log("Save/load will not be possible")
        db = null
    }
}

export function getDocumentGameData(): string | null {
    return document.head.querySelector(`script[type="gamedata"]`)?.textContent.trim() || null;
}

async function upgrade(database: IDBDatabase, fromVersion: number, toVersion: number | null) {
    console.log(`Upgrading database: v${fromVersion} --> v${toVersion}`);
    let currentVersion = fromVersion;

    // continuously update
    while (currentVersion != toVersion) {
        switch (currentVersion) {
            case 0: // 0 --> 1  ===  creation of the database
                console.log(`--   0 --> 1`);
                let saves = database.createObjectStore(STORE_NAME_SAVES, { autoIncrement: true });
                // await new Promise((resolve, reject) => { 
                //     resolve = saves.transaction.oncomplete;
                //     reject = event => saves.transaction.onerror(event.target.error)
                // });
                currentVersion = 1;
                break;
            case 1: // 1 --> 2
                console.log(`--   1 --> 2`);
                database.createObjectStore(STORE_NAME_GLOBAL_DATA, { autoIncrement: true });
                currentVersion = 2;
                break;
            case 2: // 2 -> 3
                console.log(`--   2 --> 3`);

                let objStore = database.createObjectStore(STORE_NAME_RESOURCES, { autoIncrement: true })
                objStore.createIndex("order", "uuid", { unique: true });
                currentVersion = 3;
                break;
            default:
                throw new Error(`No implementation for database version ${currentVersion}`);
        }
    }
}


export async function deleteDatabase() {
    try {
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
            request.onupgradeneeded = () => { resolve("upgrade triggered") };
        });
        console.log(result);
        location.reload();

    } catch (e) {
        console.error(e);
    }
}

export async function saveToDB(key: string, obj: Object) {
    if(_inGame) return;
    if(!db) { console.error("database access before initialization."); return; }

    let trans = db.transaction([STORE_NAME_RESOURCES], "readwrite");
    let objectStore = trans.objectStore(STORE_NAME_RESOURCES);
    
    let request = objectStore.put(await serialize(obj), key)
    
    request.onsuccess = event => {
        console.log(`saved to db ${key.substring(0, 5)}... / ${(obj as any).name || ""} (${obj.constructor.name})`);
    };

    await new Promise((resolve, reject) => {trans.oncomplete = resolve; trans.onerror = reject})
}

export async function clearDBGameData() {
    if(_inGame) return;
    if(!db) { console.error("database access before initialization."); return; }
    
    let trans = db.transaction([STORE_NAME_RESOURCES], "readwrite");
    let objectStore = trans.objectStore(STORE_NAME_RESOURCES);
    
    let request = objectStore.clear();
    
    request.onsuccess = event => {
        console.log(`Cleared database.`);
    };

    await new Promise((resolve, reject) => {trans.oncomplete = resolve; trans.onerror = reject})
}
