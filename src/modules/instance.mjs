import { ResourceManager } from "./resource_manager.mjs";

export class Instance {
    constructor(spriteID, x, y) {
        this.spriteID = spriteID; 
        this.x = x;
        this.y = y;
    }

    /**
     *  
     * @param {CanvasRenderingContext2D} ctx 
     */
    draw(ctx) {
        // draw at x y sprite
        // TODO this is v slow
        let sprite = ResourceManager.resourceManager.findByUUID(this.spriteID);
        if(sprite) {
            ctx.drawImage(sprite.canvas, this.x - sprite.originX, this.y - sprite.originY);
        }
    }
}