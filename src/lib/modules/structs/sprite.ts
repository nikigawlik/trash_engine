import type Behaviour from "./behaviour";
import { resourceManager } from "../game/ResourceManager";
import Resource from "./resource";
import BehaviourLink from "./behaviourLink";

export default class Sprite extends Resource {
    canvas: HTMLCanvasElement | null;
    originX: number;
    originY: number;
    bBoxX: number;
    bBoxY: number;
    bBoxWidth: number;
    bBoxHeight: number;
    behaviours: Behaviour[];

    _instanceConstructor: Function // function made from auto-generated code, that creates an instance of the sprite

    constructor(name="sprite") {
        super(name);
        this.canvas = null;
        this.originX = 0;
        this.originY = 0;
        this.bBoxX = 0;
        this.bBoxY = 0;
        this.bBoxWidth = 0;
        this.bBoxHeight = 0;
        this.behaviours = [];
    }

    addBehaviour(behaviour: Behaviour) {
        this.behaviours.push(behaviour);
    }

    removeBehaviour(behaviour: Behaviour|string) {
        this.behaviours = this.behaviours.filter(
            x => x != behaviour && x.uuid != behaviour
        );
    }

    resolveBehaviours(): Behaviour[] {
        this.behaviours = this.behaviours.filter(x => 
            !(x instanceof BehaviourLink) || 
            resourceManager.get().resources.has(x.linkedBehaviourUUID)
        );
        
        return this.behaviours;
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
        let params = ["x", "y"];
        let globalsMap = new Map<string, any>();
        // globalsMap.set("x", 0);
        // globalsMap.set("y", 0);
        globalsMap.set("imgScaleX", "1");
        globalsMap.set("imgScaleY", "1");
        globalsMap.set("imgRotation", "0");
        globalsMap.set("imgAlpha", "1");
        globalsMap.set("imgColor", "{r:0, g:0, b:0, a:0}");

        let _behaviours = this.resolveBehaviours();

        for(let behaviour of _behaviours) {
            for(let global of behaviour.props) {
                globalsMap.set(global, 0); // TODO let user specify default value ?
            }
        }
        const globals = Array.from(globalsMap);
        let propDefs = globals.map(g => `let ${g[0]} = ${g[1]};`);

        const props = globals.map(g => g[0]).concat(params);
        let propAccessors = props.map(p => 
`    get ${p}() {return ${p}}, set ${p}(_te_value) {${p} = _te_value},`
        );

        let code = `
"use strict";
${propDefs.join("\n")}
let update = (inst) => {};
function onUpdate(callback) {
    // closure magick 
    update = ((x) => (inst) => {x(inst); callback(inst);})(update); 
}
let me = {
${propAccessors.join("\n")}
    get spriteID() {return "${this.uuid}";},
}
${
    _behaviours.map(b => `
/* begin ${b.name} */ {
${b.code}
} /* end ${b.name} */`
    ).join("")
}
me.update = update;
return me;
        `;
        try {
            this._instanceConstructor = new Function(...params, code);
        } catch(e) {
            console.error(e);
            if(e instanceof SyntaxError) {

                if((e as any).lineNumber && (e as any).columnNumber) {
                    console.log(`${(e as any).lineNumber}, ${(e as any).columnNumber}`)
                }
            }
        } finally {     
            let pseudoFunc = 
// `(${globals.map(g => `${g[0]} = ${g[1]}`).join(", ")}) => {
`() => {
${code}
}`       
            // console.log({name: this.name, code: pseudoFunc});
            let dbg = window["te_debug"] = window["te_debug"] || {};
            dbg[this.name] = pseudoFunc;
        }
    }
}
