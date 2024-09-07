import { derived, writable } from "svelte/store";
import { db, NoDatabaseError, STORE_NAME_GLOBAL_DATA } from "./database";
import { requestAsync } from "./serialize";

// ---- save data ----

const preferedScheme = ["light", "dark"].find(theme => window.matchMedia(`(prefers-color-scheme: ${theme})`).matches);


let defaultSettings = {
    version: 1,
    editor: {
        settings: {
            themes: [
                {
                  "name": "dark",
                  "bgColor": "#222",
                  "mainColor": "#ccc",
                  "neutralColor": "#555",
                  "offMainColor": "#aaa",
                  "offBgColor": "#444"
                },
                {
                  "name": "light",
                  "bgColor": "#fdfdfd",
                  "mainColor": "#111",
                  "neutralColor": "#888",
                  "offMainColor": "#333",
                  "offBgColor": "#ccc"
                },
                {
                  "name": "trash",
                  "bgColor": "#404",
                  "mainColor": "#fda",
                  "neutralColor": "#3a3",
                  "offMainColor": "#adf",
                  "offBgColor": "#505"
                },
                {
                  "name": "hotdog",
                  "bgColor": "red",
                  "mainColor": "yellow",
                  "neutralColor": "red",
                  "offMainColor": "black",
                  "offBgColor": "red"
                }
            ],
            currentTheme: preferedScheme || "dark",
            subFolders: false,
            openResourcesMaximized: true,
            showWarningBeforeClosingApp: true,
            currentFont: "sans-serif",
        }
    }
}

const { subscribe, set, update } = writable(defaultSettings);

let _value: typeof defaultSettings;
subscribe(v => _value = v);

export const data = {
    subscribe,
    update,
    set,
    get: () => _value,
    save,
}

export const currentTheme = derived(data, ($data) => {
    let themes = $data.editor.settings.themes;
    let themeName = $data.editor.settings.currentTheme;
    return themes.find(a => a.name == themeName) || themes[0];
})

export async function save() {
    if(!db || !db.transaction) throw new NoDatabaseError();
        
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
    if(!db || !db.transaction) {
        console.log("! no database support, loading default values.")
        return;
    }

    console.log("- loading global data...")
    let trans = db.transaction(STORE_NAME_GLOBAL_DATA, "readonly");
    let objectStore = trans.objectStore(STORE_NAME_GLOBAL_DATA);
    let results = await requestAsync(objectStore.getAll());
    let result = results[results.length - 1];
    
    if(result) {
        if(result.version == defaultSettings.version) {
            data.set(result);
        }
        console.log(data.get())
        console.log("- global data loaded")
    } else {
        console.log("!! no save data found")
    }
}