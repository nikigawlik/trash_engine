import { resourceManager } from "../game/ResourceManager";
import Sprite from "./sprite";
import type * as pixi from 'pixi.js';

export default class Instance {
    spriteID: string;
    x: number;
    y: number;

    // tickScript: string;
    // _tickFunc: Function;
    // createScript: string;
    // _createFunc: Function;
    _pixiSprite: pixi.Sprite | null;

    constructor(spriteID: string, x: number, y: number) {
        this.spriteID = spriteID; 
        this.x = x;
        this.y = y;
        // TODO delete this stuff
        // this.tickScript = `
        // this.x += (Math.random() - 0.5) * 1; 
        // this.y += (Math.random() - 0.5) * 1;
        // this.x -= (this.x - this.startX) * 0.1;
        // this.y -= (this.y - this.startY) * 0.1;
        // if(player) {
        //     this.x += (player.x - this.x) * 0.01
        //     this.y += (player.y - this.y) * 0.01
        // }
        // `;
        // this.createScript = "this.startX = this.x; this.startY = this.y;";
        // this._tickFunc = new Function(this.tickScript);
        // this._createFunc = new Function(this.createScript);
    }

    create() {
        let sprite: Sprite = resourceManager.get().findByUUID(this.spriteID);
        sprite._initFunction?.call(this);
    }

    tick() {
        let sprite: Sprite = resourceManager.get().findByUUID(this.spriteID);
        sprite._updateFunction?.call(this);

        if(this._pixiSprite) {
            this._pixiSprite.x = this.x;
            this._pixiSprite.y = this.y;
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        // draw at x y sprite
        // TODO this is cached, so should be ok, but is still ugly
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