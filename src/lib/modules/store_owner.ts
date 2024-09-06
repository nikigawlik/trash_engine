import { Writable, writable } from "svelte/store";


let stores = new WeakMap<any, any>();

/**
 * Function that turns any object into a Svelte store, allowing this object to be synced throughout the app.
 * Crucially, it remembers previously created stores. Given the same object it always returns the same store.
 * If an object is replaced (rather than modified) through the store, both the old value and the new will resolve to the same store.
 * @param obj any Object
 * @returns svelte store containing the object
 */
export function asStore<T extends Object>(obj: T): Writable<T> | null {
    if(!(obj instanceof Object)) 
        return null;
        // throw new Error(`Cannot create store for non-object type ${obj === null? "null" : typeof obj}`);

    if(stores.has(obj)) return stores.get(obj);

    let store = writable(obj);

    // maintain a value -> store relationship (for Objects)
    if(obj instanceof Object) {
        stores.set(obj, store);
    }
    store.subscribe(value => {
        if(value instanceof Object) stores.set(value, store);
    })

    return store;
}

export function storeRegistered(obj: Object) {
    return stores.has(obj);
}