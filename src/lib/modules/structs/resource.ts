
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
    ownerUUID?: string;
    ordinal: number
    constructor(name = "", uuid?: string, ownerUUID?: string) {
        this.name = name;
        this.type = this.constructor.name.toLowerCase();
        this.uuid = uuid || crypto.randomUUID()
        this.ownerUUID = ownerUUID;
        this.ordinal = 0;
    }
    
    getIconElement(): string {
        return `❔`;
    }
}


