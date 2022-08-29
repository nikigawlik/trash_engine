<script lang="ts" context="module">
    let brushesSrcImage: HTMLImageElement;

    export async function init() {
        console.log("init sprite editor...")
        brushesSrcImage = new Image();
        brushesSrcImage.src = "/engineAssets/brushes.png";
        await new Promise(resolve => brushesSrcImage!.onload = resolve);
    }
</script>


<script lang="ts">
import type { CardInstance } from "../modules/cardManager";
import { html } from "../modules/deps.mjs";
import { resourceManager } from "../modules/ResourceManager";
import type Sprite from "../modules/structs/sprite";

import Card from "./Card.svelte";

    export let card: CardInstance;

    console.log(`open sprite ${card.uuid}`);
    let self: Sprite = resourceManager.get()?.findByUUID(card.uuid) as Sprite;
    $: card.name = self.name;
    $: card.className = "sprite-editor"

    // get canvas

    let canvas: HTMLCanvasElement;
    if(!self.canvas) {
        canvas = document.createElement("canvas");
        canvas.width = canvas.height = 60;
        self.originX = ~~(canvas.width / 2);
        self.originY = ~~(canvas.height / 2);

        // let ctx = canvas.getContext("2d");
        // ctx.fillStyle = colors[colors.length-1];
        // ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        self.canvas = canvas;
    } else {
        canvas = self.canvas;
    }

    // load brushes
    let brushes = [] as HTMLCanvasElement[];
    let brushWidth = brushesSrcImage.height;
    let numberOfIcons = ~~(brushesSrcImage.width / brushWidth);
    let iconDisplayWidth =  brushWidth / window.devicePixelRatio * Math.round(window.devicePixelRatio);

    for(let i = 0; i < numberOfIcons; i++) {
        let brushCanvas = document.createElement("canvas");
        brushCanvas.width = brushCanvas.height = brushWidth;
        let ctx = brushCanvas.getContext("2d")!;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(brushesSrcImage, i * brushWidth, 0, brushWidth, brushWidth, 0, 0, brushWidth, brushWidth);
        
        brushes.push(brushCanvas);

        // display width accounts for device pixel ratio
        brushCanvas.style.width = brushCanvas.style.height = iconDisplayWidth + "px";
    }
    
    let dummyIcon = () => html`<canvas width=${~~iconDisplayWidth + "px"} height=${~~iconDisplayWidth + "px"} />`
    
    let canvasDisplayWidth: number;
    let canvasDisplayHeight: number;

    let resizeCanvas = (scaleFactor: number) => {
        canvasDisplayWidth =  canvas.width / window.devicePixelRatio * scaleFactor;
        canvasDisplayHeight =  canvas.height / window.devicePixelRatio * scaleFactor;
        canvas.style.width = canvasDisplayWidth + "px";
        canvas.style.height = canvasDisplayHeight + "px";
    }

    resizeCanvas(2); // default scale

    
    // ----------------------------------------------- plumbing

    // available size for canvas
    let availableWidth: number;
    let availableHeight: number;

    // canvas size
    // account for device pixel ratio inthe big canvas
    let autoResizeCanvas = () => {
        let scaleFactor = Math.min(
            ~~(availableWidth / canvas.width * window.devicePixelRatio),
            ~~(availableHeight / canvas.height * window.devicePixelRatio)
        );
        scaleFactor = Math.max(1, scaleFactor);
        resizeCanvas(scaleFactor);
    };

    $: {availableHeight; availableWidth; autoResizeCanvas(); }

    // resize button
    let resizeButtonClick = async() => {
        let popup = createBlockingPopup(
            html`
                <p>This will <em>erase</em> your drawing!!!</p>
                <p><label> width: <input value=${canvas.width} /></label></p>
                <p><label> height: <input value=${canvas.height} /></label></p>
            `, 
            ["ok", "cancel"]
        );
        let buttons = popup.querySelectorAll("button");
        let confirmed = await new Promise(resolve => {
            buttons[0].onclick = () => resolve(true);
            buttons[1].onclick = () => resolve(false);
        });
        if(confirmed) {
            let inputs = popup.querySelectorAll("input");
            canvas.width = Math.max(1, parseInt(inputs[0].value));
            canvas.height = Math.max(1, parseInt(inputs[1].value));
            self.originX = ~~(canvas.width / 2);
            self.originY = ~~(canvas.height / 2);
            refreshSettings();
            autoResizeCanvas();
        }
        popup.remove();
    };

    elmt.querySelector("button.center-origin").onclick = () => {
        self.originX = ~~(canvas.width / 2);
        self.originY = ~~(canvas.height / 2);
    }

    // stroke select
    let currentBrush = null;
    let brushSelectButtons = elmt.querySelectorAll(".brushes>button");
    for(let button of brushSelectButtons) {
        button.onclick = () => {
            for(let otherButton of brushSelectButtons) {
                otherButton.dataset.selected = false;
            }
            button.dataset.selected = true;
            currentBrush = brushes[button.dataset.id];
        }
        button.dataset.selected = false;
    }
    brushSelectButtons[0].onclick(); // select first
    
    // canvas context
    let canvasCtx = canvas.getContext("2d");
    
    // colors
    let colorSelectButtons = elmt.querySelectorAll(".colors>button");
    let currentCanvasOP = "source-over";

    for(let button of colorSelectButtons) {
        let color = colors[button.dataset.id];
        button.style.backgroundColor = color;
        let isEraser = color == "#00000000";
        if(isEraser) button.dataset.eraser = true;

        button.onclick = () => {
            for(let otherButton of colorSelectButtons) {
                otherButton.dataset.selected = false;
            }
            button.dataset.selected = true;

            if(colorUIAdjust[color]) {
                elmt.querySelector(".brushes").dataset.backgroundTweak = colorUIAdjust[color];
            } else {
                delete elmt.querySelector(".brushes").dataset.backgroundTweak;
            }

            for(let brush of brushes) {
                let ctx = brush.getContext("2d");
                ctx.globalCompositeOperation = "source-in";
                ctx.fillStyle = !isEraser? color : "#fff"; // TODO not white
                ctx.fillRect(0, 0, brushWidth, brushWidth);
                // main canvas
                currentCanvasOP = isEraser? "destination-out" : "source-over";
            }
        }
        button.dataset.selected = false;
    }
    colorSelectButtons[colorSelectButtons.length - 1].onclick();

    // let canvas = elmt.querySelector("canvas");
    canvasCtx.fillStyle = "black";
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

        canvasCtx.globalCompositeOperation = currentCanvasOP;

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
            canvasCtx.drawImage(currentBrush, x, y);
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
    
    canvasContainer.onmouseup = () => { draw = false; }
    canvasContainer.onmouseleave = () => { draw = false; }

    // after load hack
    setTimeout(() => {
        let style = getComputedStyle(elmt);
        elmt.style.width = style.width;
        elmt.querySelector(".toolbar-container").style.flexDirection = "row";
    }, 50);

</script>

<Card autoFocus={true} {card}>
    <div class="card-settings"> 
        <p>
            <span>size: </span> <span class=size-description>{canvas.width} x {canvas.height}</span> 
            <button class=resize on:click={resizeButtonClick}> change </button>
            <span><button class=center-origin>center origin</button></span>
        </p>
    </div>
    <div class="toolbar-container">
        <div class="toolbar colors">
            ${colors.map((color, i) => html`<button data-id=${i}>${dummyIcon()}</button>`)}
        </div>
        <div class="toolbar brushes">
            ${brushes.map((icon, i) => html`<button data-id=${i}>${icon}</button>`)}
        </div>
    </div>
    <div 
        class="canvas-container" 
        bind:clientWidth={availableWidth} 
        bind:clientHeight={availableHeight}
    >
        {canvas}
    </div>
    <!-- <div class="frame-select"><input step=1 min=0 max=4 type="range" /></div> -->
</Card>

