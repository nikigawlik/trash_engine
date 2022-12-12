import type { SvelteComponent } from "svelte";
import { writable, type Writable } from "svelte/store";
import { data } from "./globalData";
import { findWindowPos } from "./ui";

export interface CardInstance {
    componentType: (typeof SvelteComponent)
    uuid: string
    name: string
    zIndex: number
    position: DOMRect
    isMaximized: boolean
    className?: string
}

let maxZ = 0;

const { subscribe, set, update } = writable([]) as Writable<CardInstance[]>;

let _value: CardInstance[];
subscribe(v => _value = v);

export let cards = {
    subscribe,
    add: (content: typeof SvelteComponent, name: string, position: DOMRect = new DOMRect(), isMaximized = false, uuid?: string) => update(store => {
        console.log(`added ${uuid}`)
        if(!store.find(x => x.uuid === uuid)) {
            store.push({
                uuid: uuid || crypto.randomUUID(),
                componentType: content,
                zIndex: ++maxZ,
                name,
                position,
                isMaximized,
            });
        }
        return store;
    }),
    remove: (uuid: string) => update(store => store.filter(x => x.uuid != uuid)),
    focus: (uuid: string) => update(store => {
        let inst = store.find(x => x.uuid == uuid);
        if(inst) inst.zIndex = ++maxZ;
        return store;
    }),
    reset: () => set([]),
    get: () => _value,
};



export function bringToFront(card: CardInstance) {
    card.zIndex = ++maxZ;
}

export function openCard(
    type: any, 
    allowDuplicate: boolean = true, 
    uuid?: string, 
    position: DOMRect = new DOMRect(),
) {
        
    // either an existing card or false/undefined
    let existing = !allowDuplicate && cards.get().find(x => x.componentType.name === type.name);
    let existingUUID = !!uuid && cards.get().find(x => x.uuid == uuid)
    existing ||= existingUUID;

    if(existing) {
        cards.focus(existing.uuid);
    } else {
        // if(position == undefined) {
        //     console.log("here")
        //     let bounds = document.querySelector("main")?.getBoundingClientRect() || new DOMRect(0, 0, 1000, 1000);
        //     let result = findWindowPos(
        //         new DOMRect(0, 0, 100, 100), 
        //         new DOMRect(0, 0, bounds.width, bounds.height),
        //         cards.get().map(x => x.position)
        //     )
        //     position = new DOMRect(result.x, result.y, 0, 0);
        // }

        const isMax = data.get().editor.settings.openResourcesMaximized;

        cards.add(type, "", position, isMax, uuid);
    }
}