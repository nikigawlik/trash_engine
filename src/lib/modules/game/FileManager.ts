import { Readable, Subscriber, Updater, writable, Writable } from "svelte/store";

/*
  [ game instance ]     <----.
                             | load
  [ resource manager ] ------'  <--.   <------------.
                                   | sync           |
  [ indexeddb ]       <------------'                |
                                                    | save / load
  [ export / import  ] <-----------------------------'

 */

/*

Create -> objectHandle().set();
Read -> objectHandle().subscribe();  getObj();
Update -> objectHandle().update();
Delete -> objectHandle().delete();


*/

// TODO sub-file stores
// TODO indexeddb integration

interface FileStore<T> extends Writable<T> {
    // inherited: set, update, subscribe   
    get: () => T
    delete: () => void
}

interface ViewStore<T> extends Writable<T> {
    condition: (value: T) => boolean
}

export default class FileManager {
    files: Map<string, any>
    stores: Map<string, FileStore<any>>
    globalStore: Readable<FileManager>

    viewStores: ViewStore<any>[]

    constructor() {
        this.files = new Map();
        this.stores = new Map();
        this.globalStore = writable(this); // needs to be writable!!
    }

    _update() {
        // triggers global store update
        (this.globalStore as Writable<FileManager>).set(this); // funny hack
    }

    objectHandle<T>(id: string, defaultValue?: T) {
        let existing = this.stores.get(id);
        if(existing != undefined) 
            return existing;


        this._setObj(id, defaultValue);
        
        let subscribers = new Set<Subscriber<T|null>>();

        function notify(value: T|null) {
            for(let sub of subscribers.values()) {
                sub(value);
            }
        }

        let store = {
            set: (value: T) => {
                this._setObj(id, value);
                notify(value);
            },
            update: (updater: Updater<T>): void => {
                let obj = updater(this.getObj(id));
                this._setObj(id, obj)
                notify(obj);
            },
            subscribe: (run: Subscriber<T|null>, invalidate?: (value?: T) => void): (() => void) => {
                subscribers.add(run);
                // returns unsubscribe
                return () => {
                    subscribers.delete(run);
                    if(invalidate) invalidate(this.getObj(id));
                };
            },
            get: () => this.getObj(id),
            delete: () => {
                this._removeObj(id);
                notify(null);
            }
        }

        this.stores.set(id, store);
        return store;
    }

    viewHandle(condition: (x: any) => boolean) : Readable<any[]> {
        let values = Array.from(this.files.values()).filter(condition); // output

        let store = writable(values) as ViewStore<any>;
        store.condition = condition;
        
        this.viewStores.push(store);

        return store;
    }

    _updateViewStores(obj: any) {
        for(let store of this.viewStores) {
            if(store.condition(obj))
                store.set(Array.from(this.files.values()).filter(store.condition))
        }
    }

    _removeObj(id: string) {
        let value = this.getObj(id);
        this.files.delete(id);
        if(value != null) 
            this._updateViewStores(value)
    }

    _setObj(id: string, value: any) {
        this.files.set(id, value);
        this._updateViewStores(value);
    }

    getObj(id: string): any|null {
        return this.files.get(id);
    }
}