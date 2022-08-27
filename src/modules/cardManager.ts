import type { SvelteComponent } from "svelte";
import { writable, type Writable } from "svelte/store";


export enum CardType {
    Window,
    PopUp,
    ContextMenu,
}

export interface CardInstance {
    cardType: CardType
    componentType: (typeof SvelteComponent)
    uuid: string
    name: string
    zIndex: number
    className?: string
}

let maxZ = 0;

const { subscribe, set, update } = writable([]) as Writable<CardInstance[]>;

// TODO use set/map instead of list to make more performant and to avoid filter(...)
let _value: CardInstance[];
subscribe(v => _value = v); // TODO evil code?

export let cards = {
    subscribe,
    add: (content: typeof SvelteComponent, name: string, uuid?: string, type: CardType = CardType.Window) => update(store => {
        if(!store.find(x => x.uuid === uuid)) {
            store.push({
                uuid: uuid || crypto.randomUUID(),
                componentType: content,
                zIndex: ++maxZ,
                name: name,
                cardType: type,
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