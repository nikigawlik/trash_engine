
<script lang="ts" context="module">
    import brushesURL from "../../assets/engineAssets/brushes.png";
    let brushesSrcImage: HTMLImageElement;

    export async function init() {
        console.log("init sprite editor...")
        brushesSrcImage = new Image();
        brushesSrcImage.src = brushesURL;
        await new Promise(resolve => brushesSrcImage!.onload = resolve);
    }

    
    // more or less primary colors plus some extra
    let colors = [
        "#00000000", // eraser
        "#000000ff",
        "#504050ff",
        "#2633dfff",
        "#ef4b2eff",
        "#f0ff4dff",
        "#4ccb2aff",
        "#9dab9fff",
        "#ffffffff",
    ]

    let colorUIAdjust: any = {
        "#000000ff": "dark",
        "#ffffffff": "light",
    }

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
</script>


<script lang="ts">
import { onMount } from "svelte";

import type { CardInstance } from "../modules/cardManager";
import { html } from "../modules/deps.mjs";
import { resourceManager } from "../modules/game/ResourceManager";
import type Sprite from "../modules/structs/sprite";
import { blockingPopup } from "../modules/ui";

import Card from "./Card.svelte";
import ResizeSpritePopUp from "./ResizeSpritePopUp.svelte";

    export let card: CardInstance;

    console.log(`open sprite ${card.uuid}`);
    let sprite: Sprite = $resourceManager?.findByUUID(card.uuid) as Sprite;
    $: {card.name = sprite.name; $resourceManager;} // $resourceManager added for reactivity
    $: card.className = "sprite-editor"

    // silly lil hack (bec. of module hot reloading)
    if(!brushesSrcImage) init();

    // get canvas

    let canvas: HTMLCanvasElement;

    if(!sprite.canvas) {
        canvas = document.createElement("canvas");
        canvas.width = canvas.height = 60;
        sprite.originX = ~~(canvas.width / 2);
        sprite.originY = ~~(canvas.height / 2);

        // let ctx = canvas.getContext("2d");
        // ctx.fillStyle = colors[colors.length-1];
        // ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        sprite.canvas = canvas;
    } else {
        canvas = sprite.canvas;
    }

    // load brushes
    let brushes = [] as HTMLCanvasElement[];
    let brushWidth = brushesSrcImage.height;
    let numberOfIcons = ~~(brushesSrcImage.width / brushWidth);
    let iconDisplayWidth =  brushWidth / window.devicePixelRatio * Math.round(window.devicePixelRatio);
    
    brushes.length = numberOfIcons; // hack lol (makes svelte generate html as if there were this many icons)

    onMount(() => {     
        for(let i = 0; i < numberOfIcons; i++) {
            // let brushCanvas = document.createElement("canvas");
            let brushCanvas = brushes[i];
            brushCanvas.width = brushCanvas.height = brushWidth;
            let ctx = brushCanvas.getContext("2d")!;
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(brushesSrcImage, i * brushWidth, 0, brushWidth, brushWidth, 0, 0, brushWidth, brushWidth);
            
            brushes[i] = brushCanvas

            // display width accounts for device pixel ratio
            brushCanvas.style.width = brushCanvas.style.height = iconDisplayWidth + "px";
        } 
    });
    
    let dummyIcon = () => `<canvas width=${~~iconDisplayWidth + "px"} height=${~~iconDisplayWidth + "px"} />`
    
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
        // make a popup
        let result = await new Promise<any>(resolve =>
        blockingPopup.set({
            componentType: ResizeSpritePopUp as any,
            data: {width: canvas.width, height: canvas.height},
            resolve,
        }));

        if(result) {
            canvas.width = Math.max(1, result.width);
            canvas.height = Math.max(1, result.height);
            sprite.originX = ~~(canvas.width / 2);
            sprite.originY = ~~(canvas.height / 2);
            autoResizeCanvas();
        }
    };

    let centerOrigin = () => {
        sprite.originX = ~~(canvas.width / 2);
        sprite.originY = ~~(canvas.height / 2);
    }

    // stroke select
    let currentBrush: HTMLCanvasElement;

    let selectBrush = (i: number) => {
        // for(let otherButton of brushSelectButtons) {
        //     otherButton.dataset.selected = false;
        // }
        // button.dataset.selected = true;
        currentBrush = brushes[i];
    }
    
    onMount(() => selectBrush(0)); // select first
    
    // canvas context
    let canvasCtx = canvas.getContext("2d")!;
    
    // colors
    let currentCanvasOP: GlobalCompositeOperation = "source-over";
    let currentColor: string;

    let isEraser = (c: string) => c == "#00000000";

    let selectColor = (i: number) => {
        let color = colors[i];
        currentColor = color;

        const eraser = isEraser(color);

        for(let brush of brushes) {
            let ctx = brush.getContext("2d")!;
            ctx.globalCompositeOperation = "source-in";
            ctx.fillStyle = !eraser? color : "#fff"; // TODO not white
            ctx.fillRect(0, 0, brushWidth, brushWidth);
            // main canvas
            currentCanvasOP = eraser? "destination-out" : "source-over";
        }
    }


    onMount(() => selectColor(colors.length - 1));

    // let canvas = elmt.querySelector("canvas");
    canvasCtx.fillStyle = "black";
    let draw = false;
    let prevX = -1;
    let prevY = -1;
    // let drawRect = (x, y) => ctx.fillRect(x-4, y-4, 8, 8);

    let drawStroke = (x1: number, y1: number, x2: number, y2: number) => {
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

        resourceManager.get()?.refresh(); // lol
    }

    // TODO these events make me uncomfortable
    // this is ok, because canvas already exists (saved in sprite)
    // but it is not very svelte-like ?
    
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

    let cancelDraw = () => { draw = false; }

    canvas.onmouseup = () => { draw = false; }

    let canvasContainer: HTMLElement;

    onMount(() => {
    canvasContainer.append(canvas);
        
        // // after load hack
        // setTimeout(() => {
        //     let style = getComputedStyle(elmt);
        //     elmt.style.width = style.width;
        //     elmt.querySelector(".toolbar-container").style.flexDirection = "row";
        // }, 50);
    });

</script>

<Card autoFocus={true} {card}>
    <div class="card-settings"> 
        <p>
            <span>size: </span> <span class=size-description>{canvas.width} x {canvas.height}</span> 
            <button class=resize on:click={resizeButtonClick}> change </button>
            <span><button on:click={centerOrigin} class=center-origin>center origin</button></span>
        </p>
    </div>
    <div class="toolbar-container">
        <div class="toolbar colors">
            {#each colors as color, i}
                {@const tweak = colorUIAdjust[color]}
                <button 
                    on:click={() => selectColor(i)}
                    data-id={i} 
                    data-eraser={isEraser(color)}
                    data-selected={currentColor == color}
                    data-background-tweak={tweak}
                    style:background-color={color}
                >
                    <!-- TODO this is werid-->
                    {@html dummyIcon()} 
                </button>
            {/each}
        </div>
        <div class="toolbar brushes">
            {#each brushes as brush, i}
              <button 
                on:click={() => selectBrush(i)} 
                data-selected={brush == currentBrush} 
                data-id={i}
            >
                <canvas bind:this={brushes[i]}></canvas>
            </button>
            {/each}
        </div>
    </div>
    <div 
        class="canvas-container" 
        bind:clientWidth={availableWidth} 
        bind:clientHeight={availableHeight}
        bind:this={canvasContainer}
        on:mouseup={cancelDraw}
        on:mouseleave={cancelDraw}
    >
        <!-- canvas -->
    </div>
    <!-- <div class="frame-select"><input step=1 min=0 max=4 type="range" /></div> -->
</Card>

