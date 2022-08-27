import ResourceManager from "../ResourceManager";
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
        // TODO this is v slow
        let sprite = ResourceManager.resourceManager.findByUUID(this.spriteID);
        if(sprite && sprite instanceof Sprite && sprite.canvas) {
            ctx.drawImage(sprite.canvas, this.x - sprite.originX, this.y - sprite.originY);
        }
    }
}