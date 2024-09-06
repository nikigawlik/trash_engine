
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
    constructor(name = "", uuid?: string) {
        this.name = name;
        this.type = this.constructor.name.toLowerCase();
        this.uuid = uuid || crypto.randomUUID()
    }
    
    getIconElement(): string {
        return `❔`;
    }
}


