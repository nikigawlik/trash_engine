import { writable } from "svelte/store";
import { db, requestAsync, STORE_NAME_GLOBAL_DATA } from "./database";

// ---- save data ----

interface GlobalSettings {
    editor: {
        settings: {
            darkMode: boolean,
            subFolders: boolean,
            openResourcesMaximized: boolean,
        }
    }
}

const { subscribe, set, update } = writable({
    editor: {
        settings: {
            darkMode: true,
            subFolders: false,
            openResourcesMaximized: true,
        }
    }
} as GlobalSettings);

let _value: GlobalSettings;
subscribe(v => _value = v);

export const data = {
    subscribe,
    update,
    set,
    get: () => _value,
    save,
}


export async function save() {
    
    if(!db || !db.transaction) return;
        
    let trans = db.transaction([STORE_NAME_GLOBAL_DATA], "readwrite");
    let objectStore = trans.objectStore(STORE_NAME_GLOBAL_DATA);
    let request = objectStore.put(data.get());
    request.onsuccess = event => {
        // event.target.result === customer.ssn;
        console.log(`saved resource ${request.result}`);
    };

    await new Promise((resolve, reject) => { 
        trans.oncomplete = e => { console.log("transaction done"); resolve(e); }; 
        trans.onerror = e => reject(request.error); 
    });
}

export async function load() {
    console.log("- loading global data...")
    let trans = db.transaction(STORE_NAME_GLOBAL_DATA, "readonly");
    let objectStore = trans.objectStore(STORE_NAME_GLOBAL_DATA);
    let results = await requestAsync(objectStore.getAll());
    let result = results[results.length - 1];
    
    if(result) {       
        data.set(result);
        console.log("- global data loaded")
    } else {
        console.log("!! no save data found")
    }
}