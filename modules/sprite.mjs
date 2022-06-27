import { appendCard, Card, cards } from "./components.mjs";
import { html } from "./deps.mjs";
import { Resource } from "./resource.mjs";
import { bringToFront } from "./ui.mjs";

console.log("sprite_editor.mjs loading")

let brushesSrcImage = null; // set in init

// more or less primary colors plus some extra
let colors = [
    "#000000",
    "#504050",
    "#2633df",
    "#ef4b2e",
    "#f0ff4d",
    "#4ccb2a",
    "#9dab9f",
    "#ffffff",
]
// dawnbringers 8 col palette /w pure white
// let colors = [
//     "#000000",
//     "#55415f",
//     "#646964",
//     "#d77355",
//     "#508cd7",
//     "#64b964",
//     "#e6c86e",
//     "#ffffff"
// ]

export async function init() {
    console.log("init sprite editor...")
    brushesSrcImage = new Image();
    brushesSrcImage.src = "/engineAssets/brushes.png";
    await new Promise(resolve => brushesSrcImage.onload = resolve);
}

export class Sprite extends Resource {
    constructor(name="sprite", resourceManager=null) {
        super(name, resourceManager);
        this.canvas = null;
        this.atlasLocation = { x: 0, y: 0, w: 1, h: 1};
    }

    openEditorWindow() {
        // look for existing
        let existing = cards.find(x => x.dataset.resourceUuid == this.uuid);
        
        if(existing) {
            bringToFront(existing);
        } else {
            let elmt = html`
            <${SpriteWindow} sprite=${this} />
            `;
            appendCard(elmt);
        }  
    }
}

export let SpriteWindow = (attrs = {sprite: null, }) => {
    // get canvas
    /** @type HTMLCanvasElement */
    let canvas = attrs.sprite.canvas;
    if(!canvas) {
        canvas = document.createElement("canvas");
        canvas.width = canvas.height = 100;

        let ctx = canvas.getContext("2d");
        ctx.fillStyle = colors[colors.length-1];
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        attrs.sprite.canvas = canvas;
    }

    // load brushes
    let brushes = [];
    let brushWidth = brushesSrcImage.height;
    let numberOfIcons = ~~(brushesSrcImage.width / brushWidth);
    let iconDisplayWidth =  brushWidth / window.devicePixelRatio * Math.round(window.devicePixelRatio);

    for(let i = 0; i < numberOfIcons; i++) {
        let brushCanvas = document.createElement("canvas");
        brushCanvas.width = brushCanvas.height = brushWidth;
        let ctx = brushCanvas.getContext("2d");
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(brushesSrcImage, i * brushWidth, 0, brushWidth, brushWidth, 0, 0, brushWidth, brushWidth);
        
        brushes.push(brushCanvas);

        // display width accounts for device pixel ratio
        brushCanvas.style.width = brushCanvas.style.height = iconDisplayWidth + "px";
    }
    
    let dummyIcon = () => html`<canvas width=${~~iconDisplayWidth + "px"} height=${~~iconDisplayWidth + "px"} />`
    
    // TODO this is dependent on current zoom level!!! (-> do something on resize event?)
    // account for device pixel ratio inthe big canvas, too
    let canvasDisplayWidth =  canvas.width / window.devicePixelRatio * Math.round(window.devicePixelRatio) * 2;
    canvas.style.width = canvas.style.height = canvasDisplayWidth + "px";

    /** @type HTMLElement */let elmt = html`
        <${Card} name=${attrs.sprite.name} resourceUUID=${attrs.sprite.uuid} class=sprite-editor>
            <div class="card-settings"> --- </div>
            <div class="toolbar colors">
                ${colors.map((color, i) => html`<button value=${i}>${dummyIcon()}</button>`)}
            </div>
            <div class="toolbar brushes">
                ${brushes.map((icon, i) => html`<button value=${i}>${icon}</button>`)}
            </div>
            <div class="canvas-container">${canvas}</div>
        <//>
    `;

    // stroke select
    let currentBrush = null;
    let brushSelectButtons = elmt.querySelectorAll(".brushes>button");
    for(let button of brushSelectButtons) {
        button.onclick = () => {
            for(let otherButton of brushSelectButtons) {
                otherButton.dataset.selected = false;
            }
            button.dataset.selected = true;
            currentBrush = brushes[button.value];
        }
        button.dataset.selected = false;
    }
    brushSelectButtons[0].onclick(); // select first
    

    // colors
    let colorSelectButtons = elmt.querySelectorAll(".colors>button");
    for(let button of colorSelectButtons) {
        button.style.backgroundColor = colors[button.value];

        button.onclick = () => {
            for(let brush of brushes) {
                let ctx = brush.getContext("2d");
                ctx.globalCompositeOperation = "source-in";
                ctx.fillStyle = colors[button.value];
                ctx.fillRect(0, 0, brushWidth, brushWidth);
            }
        }
    }

    // let canvas = elmt.querySelector("canvas");
    let ctx = canvas.getContext("2d");
    ctx.fillStyle = "black";
    let draw = false;
    let prevX = -1;
    let prevY = -1;
    // let drawRect = (x, y) => ctx.fillRect(x-4, y-4, 8, 8);

    let drawStroke = (x1, y1, x2, y2) => {
        const scale =  canvas.width / canvasDisplayWidth;
        x1 *= scale; y1 *= scale; x2 *= scale; y2 *= scale;
        x1 = ~~x1; y1 = ~~y1; x2 = ~~x2; y2 = ~~y2;
        let dx = (x2-x1);
        let dy = (y2-y1);

        let alongX = Math.abs(dx) > Math.abs(dy);
        let dLong = alongX? dx : dy;
        if(dLong < 0) { 
            // swap p1 and p2
            x1 += dx; x2 -= dx; 
            y1 += dy; y2 -= dy; 
            dx *= -1; dy *= -1; dLong *= -1;
        }
        for(let i = 0; i <= dLong; i++) {
            let rx = alongX? i : ~~((i / dy) * dx);
            let ry = !alongX? i : ~~((i / dx) * dy);
            let x = x1 + rx - ~~(brushWidth / 2);
            let y = y1 + ry - ~~(brushWidth / 2);
            ctx.drawImage(currentBrush, x, y);
        }
    }
    
    canvas.onmousedown = (e) => { 
        draw = true; 
        prevX = e.offsetX;
        prevY = e.offsetY; 
        drawStroke(prevX, prevY, prevX, prevY);
    }

    canvas.onmousemove = (e) => { 
        if(draw) {
            // ctx.ellipse(e.offsetX, e.offsetY, 8, 8, 0, 0, 360); 
            // ctx.fill();
            let x = e.offsetX;
            let y = e.offsetY;
            drawStroke(prevX, prevY, x, y);
            prevX = x;
            prevY = y;
        }
    }
    canvas.onmouseup = () => { draw = false; }
    
    let canvasContainer = elmt.querySelector(".canvas-container");
    canvasContainer.onmouseup = () => { draw = false; }
    canvasContainer.onmouseleave = () => { draw = false; }

    return elmt;
}
