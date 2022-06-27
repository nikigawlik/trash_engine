import { db, requestAsync, STORE_NAME_GLOBAL_DATA } from "./database.mjs";

// ---- save data ----
export let data = {};
data.editor = {};

data.editor.settings = {
    darkMode: false,
    subFolders: false,
}

export async function save() {
    
    if(!db || !db.transaction) return;
        
    let trans = db.transaction([STORE_NAME_GLOBAL_DATA], "readwrite");
    let objectStore = trans.objectStore(STORE_NAME_GLOBAL_DATA);
    let request = objectStore.put(data);
    request.onsuccess = event => {
        // event.target.result === customer.ssn;
        console.log(`saved resource ${event.target.result}`);
    };

    await new Promise((resolve, reject) => { 
        trans.oncomplete = e => console.log("transaction done") && resolve(e); 
        trans.onerror = e => reject(e.target.error); 
    });
}

export async function load() {
    let trans = db.transaction(STORE_NAME_GLOBAL_DATA, "readonly");
    let objectStore = trans.objectStore(STORE_NAME_GLOBAL_DATA);
    let results = await requestAsync(objectStore.getAll());
    let result = results[results.length - 1];

    if(result) {       
        console.log(result);   
        data = result;
    } else {
        console.log("!! no save data found")
    }
}