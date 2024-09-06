
export default class Instance {
    spriteID: string;
    x: number;
    y: number;

    constructor(spriteID: string, x: number, y: number) {
        this.spriteID = spriteID; 
        this.x = x;
        this.y = y;
    }

    // clone() {
    //     let inst = new Instance(this.spriteID, this.x, this.y);
    //     return inst;
    // }
}