import { resourceManager } from "../game/ResourceManager";
import Sprite from "./sprite";

export default class Instance {
    spriteID: string;
    x: number;
    y: number;

    constructor(spriteID: string, x: number, y: number) {
        this.spriteID = spriteID; 
        this.x = x;
        this.y = y;
    }

    draw(ctx: CanvasRenderingContext2D) {
        // draw at x y sprite
        let sprite = resourceManager.get().getResource(this.spriteID);
        
        if(sprite && sprite instanceof Sprite && sprite.canvas) {
            ctx.drawImage(sprite.canvas, this.x - sprite.originX, this.y - sprite.originY);
        } else {
            console.log(`sprite ${this.spriteID} does not exist.`)
        }
    }

    isValid() {
        let sprite = resourceManager.get().getResource(this.spriteID);
        return sprite && sprite instanceof Sprite;
    }

    // clone() {
    //     let inst = new Instance(this.spriteID, this.x, this.y);
    //     return inst;
    // }
}