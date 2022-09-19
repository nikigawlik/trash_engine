import { resourceManager } from "../game/ResourceManager";
import Sprite from "./sprite";

export default class Instance {
    spriteID: string;
    x: number;
    y: number;

    tickScript: string;
    _tickFunc: Function;

    constructor(spriteID: string, x: number, y: number) {
        this.spriteID = spriteID; 
        this.x = x;
        this.y = y;
        // TODO CONT here
        this.tickScript = "this.x += Math.random() - 0.5; this.y += Math.random() - 0.5;";
        this._tickFunc = new Function(this.tickScript);
    }

    tick() {
        this._tickFunc.call(this);
    }

    draw(ctx: CanvasRenderingContext2D) {
        // draw at x y sprite
        // TODO this is v slow
        let sprite = resourceManager.get().findByUUID(this.spriteID);
        if(sprite && sprite instanceof Sprite && sprite.canvas) {
            ctx.drawImage(sprite.canvas, this.x - sprite.originX, this.y - sprite.originY);
        } else {
            console.log(`sprite ${this.spriteID} does not exist.`)
        }
    }

    isValid() {
        let sprite = resourceManager.get().findByUUID(this.spriteID);
        return sprite && sprite instanceof Sprite;
    }

    clone() {
        let inst = new Instance(this.spriteID, this.x, this.y);
        return inst;
    }
}