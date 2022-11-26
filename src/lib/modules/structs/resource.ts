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
    _resourceManager: ResourceManager;
    _icon: HTMLElement | null;
    _priority: number
    constructor(name = "", resourceManager: ResourceManager) {
        this.name = name;
        this.type = this.constructor.name.toLowerCase();
        this.uuid = crypto.randomUUID(),
        this._resourceManager = resourceManager;
        this._icon = null;
        this._priority = 0;
    }

    removeSelf(): void  {
        this._resourceManager?._resources.delete(this.uuid);
    }

    getIconElement(): string {
        return `❔`;
    }
    
    add(other: any) {
        throw new Error("Method not implemented.");
    }
}


