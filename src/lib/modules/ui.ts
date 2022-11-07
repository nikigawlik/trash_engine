import type { SvelteComponent } from "svelte";
import { writable, type Writable } from "svelte/store";
import BlockingPopUpSvelte from "../components/BlockingPopUp.svelte";
import GetTextPopUpSvelte from "../components/GetTextPopUp.svelte";
import { rectInside, rectIntersect } from "./game/utils";

console.log("ui module loading")

export interface AbstractPrompt {
    componentType: (typeof SvelteComponent)
    text?: string
    buttons?: AbstractButton[]
    // defaultText?: string
    // width?: number
    // height?: number
    data: any
    resolve: (value: any) => void
}

export interface AbstractButton {
    text: string
    callback: () => Promise<void>|void
    disabled?: boolean
}


export let blockingPopup = writable(null) as Writable<AbstractPrompt|null>;

// TODO might never resolve
export let asyncYesNoPopup = async (question: string) => {
    return await new Promise(resolve => {
        blockingPopup.set({
            componentType: BlockingPopUpSvelte as any,
            text: question,
            data: null,
            buttons: [
                { text: "yes", callback: () => resolve(true) },
                { text: "no", callback: () => resolve(false) },
            ],
            resolve
        });
    });
}


export let asyncGetTextPopup = async (question: string, defaultText: string) : Promise<string> => {
    return await new Promise(resolve => {
        // this is a AbstractGetTextPrompt
        blockingPopup.set({
            componentType: GetTextPopUpSvelte as any,
            text: question,
            buttons: [],
            data: defaultText,
            resolve,
        });
    });
};

/* ------- old stuff -------   */

export function findWindowPos(elementRect: DOMRect, boundsRect: DOMRect, otherCardsRects: DOMRect[]) {
    let meRect = elementRect;
    let bounds = boundsRect;
    let others = otherCardsRects;

    let cans: DOMRect[] = [];

    let freeAt = (rect: DOMRect) => {
        for(let otherRect of others) {
            if(rectIntersect(rect, otherRect)) {
                return false;
            }
        }
        return true;
    }

    if(freeAt(meRect)) {
        cans.push(meRect);
    }

    for(let otherRect of others) {
        // check right
        let p1 = new DOMRect(otherRect.right, otherRect.y, meRect.width, meRect.height);
        if(freeAt(p1)) cans.push(p1)
        // check down
        let p2 = new DOMRect(otherRect.x, otherRect.bottom, meRect.width, meRect.height);
        if(freeAt(p2)) cans.push(p2)
    }
    cans = cans.filter(x => rectInside(x, bounds));
    if(cans.length == 0) 
        return new DOMRect(bounds.left, bounds.top, meRect.width, meRect.height);
    let norm = (rect: DOMRect) => rect.y * 10000 + rect.x;
    let result = cans.reduceRight((a,b) => norm(a) < norm(b)? a : b);
    // console.log(result)
    return result;
}
