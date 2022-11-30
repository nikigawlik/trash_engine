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
    _priority: number
    constructor(name = "") {
        this.name = name;
        this.type = this.constructor.name.toLowerCase();
        this.uuid = crypto.randomUUID(),
        this._priority = 0;
    }
    
    getIconElement(): string {
        return `❔`;
    }
}


