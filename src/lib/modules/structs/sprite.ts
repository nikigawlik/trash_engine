import type { Set } from "typescript";
import type ResourceManager from "../game/ResourceManager";
import Resource from "./resource";
import type Behaviour from "../game/behaviour";

console.log("sprite_editor.ts loading")


export default class Sprite extends Resource {
    canvas: HTMLCanvasElement | null;
    originX: number;
    originY: number;
    bBoxX: number;
    bBoxY: number;
    bBoxWidth: number;
    bBoxHeight: number;
    behaviours: Behaviour[];

    // initCode: string;
    // updateCode: string;
    // _initFunction: Function;
    // _updateFunction: Function;

    _instanceConstructor: Function // function made from auto-generated code, that creates an instance of the sprite

    constructor(name="sprite", resourceManager: ResourceManager) {
        super(name, resourceManager);
        this.canvas = null;
        this.originX = 0;
        this.originY = 0;
        this.bBoxX = 0;
        this.bBoxY = 0;
        this.bBoxWidth = 0;
        this.bBoxHeight = 0;
        this.behaviours = [];
        // this.initCode = "// this code is executed when the sprite is created\n";
        // this.updateCode = "// this code is executed every update (60 times per second)\n";
    }

    // get bBoxWidth() { return this.canvas?.width; }
    // get bBoxHeight() { return this.canvas?.height; }

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

    autoCalculateBBox() {
        if(this.canvas) {
            let imgDat = this.canvas.getContext("2d").getImageData(0, 0, this.canvas.width, this.canvas.height);
            let minX = Infinity;
            let minY = Infinity;
            let maxX = -Infinity;
            let maxY = -Infinity;
            
            for(let y = 0; y < this.canvas.height; y++) 
            for(let x = 0; x < this.canvas.width; x++) {
                const i = this.canvas.width * y + x;
                const solid = imgDat.data[i*4 + 3] > 64;
                if(solid) {
                    minX = Math.min(minX, x);
                    minY = Math.min(minY, y);
                    maxX = Math.max(maxX, x);
                    maxY = Math.max(maxY, y);
                }
            }
            this.bBoxX = minX;
            this.bBoxY = minY;
            this.bBoxWidth = maxX - minX + 1;
            this.bBoxHeight = maxY - minY + 1;
            this.originX = ~~(this.canvas.width / 2);
            this.originY = ~~(this.canvas.height / 2);
        }
    }

    generateCode() {
        let globalsMap = new Set<string>();
        globalsMap.add("x");
        globalsMap.add("y");
        for(let behaviour of this.behaviours) {
            for(let global of behaviour.props) {
                globalsMap.add(global);
            }
        }
        const globals = Array.from(globalsMap);

        let props = globals.map(g => 
`    get ${g}() {return ${g}}, set ${g}(value) {${g} = value},`
        ).join("\n");

        let code = `
"use strict";
let update = (inst) => {};
function onUpdate(callback) {
    // closure magick 
    update = ((x) => (inst) => {x(inst); callback(inst);})(update); 
}
${
    this.behaviours.map(b => `
/* ${b.name} */ {
${b.code}
} /* /${b.name} */`
    ).join("")
}
return {
    update,
${props}
    get spriteID() {return "${this.uuid}";},
}
        `;
        try {
            this._instanceConstructor = new Function(...globalsMap, code);
        } catch(e) {
            console.error(e);
            if(e instanceof SyntaxError) {

                if((e as any).lineNumber && (e as any).columnNumber) {
                    console.log(`${(e as any).lineNumber}, ${(e as any).columnNumber}`)
                }
            }
        } finally {            
            console.log(`
${globals.join(", ")}
${code}
            `)
        }
    }
}
