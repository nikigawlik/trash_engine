import type { SvelteComponent } from "svelte";
import { writable, type Writable } from "svelte/store";
import { assert } from "./game/utils";
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
    add: (content: typeof SvelteComponent, name: string, position: DOMRect = new DOMRect(), isMaximized = false, uuid?: string, data: any = {}, replaceUUID?: string) => update(cardsArray => {
        console.log(`add/replace ${content.name} / ${uuid}`)
        let replacePos = replaceUUID? cardsArray.findIndex(x => x.uuid === replaceUUID) : -1;
        
        if(!cardsArray.find(x => x.uuid === uuid)) {
            let cardObj = {
                uuid: uuid || crypto.randomUUID(),
                componentType: content,
                zIndex: ++maxZ,
                name,
                position,
                isMaximized,
                data,
            };
            if(replacePos >= 0) 
                cardsArray[replacePos] = cardObj
            else
                cardsArray.push(cardObj);
        }
        return cardsArray;
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
    uuid?: string, 
    position: DOMRect = new DOMRect(),
    customData?: any,
) {
    const allowDuplicate = false; // could be turned into a setting, used to be a parameter
    assert(typeof uuid == "string" || typeof uuid == "undefined");
        
    // either an existing card or false/undefined
    let existingOfType : CardInstance|null = cards.get().find(x => x.componentType.name === type.name) || null;
    let existingByUUID : CardInstance|null = uuid? cards.get().find(x => x.uuid == uuid) || null : null;

    if(existingByUUID) {
        // exact uuid match => focus
        cards.focus(existingByUUID.uuid);
    } else if(!uuid && existingOfType) {
        // if no uuid is given and the type exists => focus
        cards.focus(existingOfType.uuid);
    } else {
        // otherwise => create a new card

        let replaceUUID: string|undefined = 
        (uuid && existingOfType && !allowDuplicate) ?
            existingOfType.uuid
        :
            undefined
        ;

        const isMax = data.get().editor.settings.openResourcesMaximized;
        cards.add(type, "", position, isMax, uuid, customData, replaceUUID);
    }
}