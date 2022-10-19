import type ResourceManager from "../game/ResourceManager";
import Resource from "./resource";

console.log("sprite_editor.ts loading")


export default class Sprite extends Resource {
    canvas: HTMLCanvasElement | null;
    originX: number;
    originY: number;

    initCode: string;
    updateCode: string;
    _initFunction: Function;
    _updateFunction: Function;

    constructor(name="sprite", resourceManager?: ResourceManager) {
        super(name, resourceManager);
        this.canvas = null;
        this.originX = 0;
        this.originY = 0;
        this.initCode = "// this code is executed when the sprite is created\n";
        this.updateCode = "// this code is executed every update (60 times per second)\n";
    }

    getCopy() {
        let newCanvas = document.createElement("canvas");
        if(this.canvas) {
            newCanvas.width = this.canvas.width;
            newCanvas.height = this.canvas.height;
            let ctx = newCanvas.getContext("2d");
            ctx?.drawImage(this.canvas, 0, 0);
        }
        return newCanvas;
    }

    getIconElement() {
        // no icon element
        return "#";
    }
}
