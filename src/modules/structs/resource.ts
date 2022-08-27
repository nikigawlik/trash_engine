import ContextMenuSvelte from "./../../components/ContextMenu.svelte";
import { cards, CardType } from "../cardManager";
import type ResourceManager from "../ResourceManager";
import type Folder from "./folder";
import { asyncGetTextPopup, asyncYesNoPopup } from "../components";

console.log("resources.mjs loading")


/*

refactor stuff:

this class should not contain editor/ui stuff, but is more like a _struct_ of 
game relevant data.

*/

export default class Resource {
    name: string;
    type: string;
    uuid: string;
    _parent: Folder | null;
    _resourceManager: ResourceManager;
    _icon: HTMLElement | null;
    constructor(name = "", resourceManager: ResourceManager) {
        this.name = name;
        this.type = this.constructor.name.toLowerCase();
        this.uuid = crypto.randomUUID();
        this._parent = null;
        this._resourceManager=resourceManager;
        this._icon = null;
    }

    getTopFolder() : Folder|null {
        if(!this._parent) 
            return null;
        
        let current: Folder = this._parent;
        while(current._parent && current._parent != this._resourceManager.root) {
            current = current._parent;
        }
        // if(current == this) return null;
        return current;
    }

    isTopFolder() {
        return this._parent == this._resourceManager.root;
    }

    isParentOf(resource: Resource) {
        let current: Resource | null = resource;
        while(current) {
            current = current._parent;
            if(current == this) return true;
        }
        return false
    }

    removeSelf(): void  {
        this._parent?.remove(this);
    }


    openEditorWindow() {
        console.log(`no window implemented for ${this.type}`);
    }

    getIconElement(): string|HTMLElement {
        return `<span>❔</span>`;
    }

    
    add(other: any) {
        throw new Error("Method not implemented.");
    }

    render(other: any) {
        throw new Error("dON'T Use this..");
    }
}


