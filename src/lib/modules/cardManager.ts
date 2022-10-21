import type { SvelteComponent } from "svelte";
import { writable, type Writable } from "svelte/store";

export interface CardInstance {
    componentType: (typeof SvelteComponent)
    uuid: string
    name: string
    zIndex: number
    position: DOMRect
    className?: string
}

let maxZ = 0;

const { subscribe, set, update } = writable([]) as Writable<CardInstance[]>;

let _value: CardInstance[];
subscribe(v => _value = v); // TODO evil code?

export let cards = {
    subscribe,
    add: (content: typeof SvelteComponent, name: string, position: DOMRect = new DOMRect(), uuid?: string) => update(store => {
        console.log(`added ${uuid}`)
        if(!store.find(x => x.uuid === uuid)) {
            store.push({
                uuid: uuid || crypto.randomUUID(),
                componentType: content,
                zIndex: ++maxZ,
                name,
                position,
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
    x: number = 0, 
    y: number = 0, 
    w: number = 0,
    h: number = 0,
) {
        
    // either an existing card or false/undefined
    let existing = !allowDuplicate && cards.get().find(x => x.componentType === type);
    let existingUUID = !!uuid && cards.get().find(x => x.uuid == uuid)
    existing ||= existingUUID;

    if(existing) {
        cards.focus(existing.uuid);
    } else {
        cards.add(type, "", new DOMRect(x, y, w, h), uuid);
    }
}