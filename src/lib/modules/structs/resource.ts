import type ResourceManager from "../game/ResourceManager";
import type Folder from "./folder";

console.log("resources.ts loading")


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
    constructor(name = "", resourceManager?: ResourceManager) {
        this.name = name;
        this.type = this.constructor.name.toLowerCase();
        this.uuid = crypto.randomUUID();
        this._parent = null;
        this._resourceManager = resourceManager;
        this._icon = null;
    }

    getTopFolder() : Folder|null {
        if(!this._parent) 
            return null;
        if(this._parent == this._resourceManager.root)
            return this as unknown as Folder; // kinda hacky, but who cares
        
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

    getIconElement(): string {
        return `❔`;
    }
    
    add(other: any) {
        throw new Error("Method not implemented.");
    }
}


