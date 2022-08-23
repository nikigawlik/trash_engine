import { writable } from "svelte/store";
import { db, requestAsync, STORE_NAME_GLOBAL_DATA } from "./database";

// ---- save data ----
export const data = writable({
    editor: {
        settings: {
            darkMode: false,
            subFolders: false,
            openResourcesMaximized: false,
        }
    }
});

export async function save() {
    
    if(!db || !db.transaction) return;
        
    let trans = db.transaction([STORE_NAME_GLOBAL_DATA], "readwrite");
    let objectStore = trans.objectStore(STORE_NAME_GLOBAL_DATA);
    let request = objectStore.put(data);
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