import type { SvelteComponent } from "svelte";
import { writable, type Writable } from "svelte/store";
import { data } from "./globalData";

export interface CardInstance {
    componentType: (typeof SvelteComponent)
    uuid: string
    name: string
    zIndex: number
    position: DOMRect
    isMaximized: boolean
    className?: string
    data?: any
    onFocus?: () => void
}

let maxZ = 0;

const { subscribe, set, update } = writable([]) as Writable<CardInstance[]>;

let _value: CardInstance[];
subscribe(v => _value = v);

export let cards = {
    subscribe,
    add: (content: typeof SvelteComponent, name: string, position: DOMRect = new DOMRect(), isMaximized = false, uuid?: string, data: any = {}) => update(store => {
        console.log(`added ${uuid}`)
        if(!store.find(x => x.uuid === uuid)) {
            store.push({
                uuid: uuid || crypto.randomUUID(),
                componentType: content,
                zIndex: ++maxZ,
                name,
                position,
                isMaximized,
                data,
            });
        }
        return store;
    }),
    remove: (uuid: string, removeDependents = false) => 
        update(store => store.filter(removeDependents? 
            (x => !x.uuid.startsWith(uuid))
            :
            (x => x.uuid !== uuid)
        )
    )
    ,
    focus: (uuid: string) => update(store => {
        let inst = store.find(x => x.uuid == uuid);
        if(inst) {
            inst.zIndex = ++maxZ;
            if(inst.onFocus instanceof Function) inst.onFocus();
        }
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
    customData?: any,
) {
        
    // either an existing card or false/undefined
    let existing = !allowDuplicate && cards.get().find(x => x.componentType.name === type.name);
    let existingUUID = !!uuid && cards.get().find(x => x.uuid == uuid)
    existing ||= existingUUID;

    if(existing) {
        cards.focus(existing.uuid);
    } else {
        const isMax = data.get().editor.settings.openResourcesMaximized;

        cards.add(type, "", position, isMax, uuid, customData);
    }
}