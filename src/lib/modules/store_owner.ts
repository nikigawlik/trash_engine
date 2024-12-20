import { derived, readable, Writable, writable } from "svelte/store";
import { gameData } from "./game/game_data";
import { data } from "./globalData";
import { logger } from "./logger";
import Resource from "./structs/resource";

let stores = new WeakMap<any, any>();

// for debug logging
let customNames = new WeakMap<any, string>();
gameData.subscribe(value => { 
    if(value instanceof Object) {
        customNames.set(value, "gameData")
        customNames.set(value.settings, "gameData.settings")
    }
})
data.subscribe(value => { if(value instanceof Object) customNames.set(value, "editorData")})


/**
 * Function that turns any object into a Svelte store, allowing this object to be synced throughout the app.
 * Crucially, it remembers previously created stores. Given the same object it always returns the same store.
 * If an object is replaced (rather than modified) through the store, both the old value and the new will resolve to the same store.
 * @param obj any Object
 * @returns svelte store containing the object
 */
export function asStore<T extends Object>(obj: T, name?: string): Writable<T> | null {
    if (!(obj instanceof Object))
        return null;

    if(name) customNames.set(obj, name)
    // throw new Error(`Cannot create store for non-object type ${obj === null? "null" : typeof obj}`);

    if (stores.has(obj)) return stores.get(obj);

    let store = writable(obj);

    // maintain a value -> store relationship (for Objects)
    if (obj instanceof Object) {
        stores.set(obj, store);
    }

    let prevValue = deepClone(obj);

    store.subscribe(value => {
        if (value instanceof Object) {
            stores.set(value, store);
            if(name) customNames.set(value, name);
        }

        // make diff
        const currentValue = deepClone(value);
        const basePath = 
            customNames.has(value) ?
                customNames.get(value)
            :
            (
                value instanceof Resource ?
                    `${value.type}_${value.name}_${value.uuid.substring(0, 5)}`
                :
                    value?.constructor?.name
            )
        ;
        let diffs = objectDiffs(prevValue, currentValue, basePath);

        // TODO include before after values from the diff in log msg

        if (diffs.length == 0) {
            // logger.log(`store trigger: ${basePath}`, { type: "storeTrigger", currentValue })
        }
        else if (diffs.length == 1){
            let diff = diffs[0];
            logger.consoleLevel = "message"; // TODO not here :d
            logger.log(`store change: ${diff.type} ${diff.path}`, { type: "storeChange", diffs, currentValue, prevValue })
        }

        prevValue = currentValue;
    })

    return store;
}

export function storeRegistered(obj: Object) {
    return stores.has(obj);
}

export function asStoreNullSafe<T>(obj: T | null, fallback: T) {
    if(!obj) return readable(fallback);
    const store = asStore(obj);
    return derived(store, x => (x || fallback))
}


// function deepClone(obj: any) {
//     // return deserialize(serialize(obj), new WeakMap<any, any>());
//     // return JSON.parse(JSON.stringify(obj));
//     // return structuredClone(obj);
// }

function deepClone(obj: any) {
    if (obj === null || typeof obj !== 'object') {
        return obj; // Return the value if obj is not an object
    }

    // Check if it's a Canvas element or another non-cloneable object
    if (obj instanceof HTMLCanvasElement) {
        return obj; // Simply transfer the reference
    }

    // Handle maps
    if (obj instanceof Map) {
        const copyMap = new Map();
        for (const [key, value] of obj.entries()) {
            copyMap.set(deepClone(key), deepClone(value));
        }
        return copyMap;
    }

    // Create an object or array to hold the properties
    const copy = Array.isArray(obj) ? [] : {};

    // Recursively clone each property
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            copy[key] = deepClone(obj[key]); // Recursively clone
        }
    }

    return copy;
}


function objectDiffs(obj1: any, obj2: any, path = "") {
    let diffs = [] as ReturnType<typeof makeDiff>[];

    if (obj1 == obj2) {
        // pass
    }
    else if (obj1 instanceof Array && obj2 instanceof Array) {
        let i1 = 0
        let i2 = 0
        // while i1 in array1 and i2 in array2:
        while (i1 < obj1.length && i2 < obj2.length) {
            //     compare at i1 and i2
            let newPath1 = path + `[${i1}]`;
            let newPath2 = path + `[${i2}]`;
            let compResult = objectDiffs(obj1[i1], obj2[i2], newPath2);

            if (compResult.length == 0) {
                i1++; i2++;
                continue;
            }

            const compResultAdv1 = objectDiffs(obj1[i1 + 1], obj2[i2], newPath2);

            if (compResultAdv1.length == 0) {
                diffs.push(makeDiff("delete", newPath1, obj1[i1], undefined))
                i1++;
                continue;
            }

            const compResultAdv2 = objectDiffs(obj1[i1], obj2[i2 + 1], newPath2);

            if (compResultAdv2.length == 0) {
                diffs.push(makeDiff("create", newPath2, undefined, obj2[i2]))
                i2++;
                continue;
            }

            // now it counts as a change
            diffs.push(...compResult);
            i1++;
            i2++;
        }
        // handle trailing entries
        while (i1 < obj1.length) {
            let newPath1 = path + `[${i1}]`;
            diffs.push(makeDiff("delete", newPath1, obj1[i1], undefined))
            i1++;
        }
        while (i2 < obj2.length) {
            let newPath2 = path + `[${i2}]`;
            diffs.push(makeDiff("create", newPath2, undefined, obj2[i2]))
            i2++;
        }
    }
    else if (obj1 instanceof Object && obj2 instanceof Object) {
        // use a map to find keys that exist in both, or one of the objects
        // (using this enum):
        const FIRST = 1;
        const SECOND = 2;
        const BOTH = 3;

        let m = new Map<string, number>();

        const keys1 = obj1 instanceof Map? obj1.keys() : Object.keys(obj1);
        const keys2 = obj2 instanceof Map? obj2.keys() : Object.keys(obj2);

        for (let key of keys1) {
            m.set(key, FIRST);
        }
        for (let key of keys2) {
            m.set(key, m.has(key) ? BOTH : SECOND);
        }

        for (let [key, value] of m.entries()) {
            const keyPath = path + "." + key;
            const value1 = obj1 instanceof Map? obj1.get(key) : obj1[key];
            const value2 = obj2 instanceof Map? obj2.get(key) : obj2[key];

            if (value == FIRST)
                diffs.push(makeDiff("delete", keyPath, value1, undefined));
            else if (value == SECOND)
                diffs.push(makeDiff("create", keyPath, undefined, value2));
            else if (value == BOTH) {
                diffs.push(...objectDiffs(value1, value2, keyPath));
            }
        }
    }
    else {
        if (obj1 !== obj2) {
            diffs = [makeDiff("update", path, obj1, obj2)];
        }
    }

    return diffs;
}

function makeDiff(type: "create"|"delete"|"update", path: string, before: any, after: any) {
    return {type, path, before, after};
}