
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
    import type { Writable } from "svelte/store";
    import { resourceManager } from "../modules/game/ResourceManager";
    import type Sprite from "../modules/structs/sprite";
    import { blockingPopup } from "../modules/ui";
    import ResizeSpritePopUp from "./ResizeSpritePopUp.svelte";
    import { adjustedCanvasSize } from "../modules/game/utils";
    import { currentTheme, data } from "../modules/globalData";
    import { onMount } from "svelte";
    import AtlasIcon from "./AtlasIcon.svelte";

    // silly lil hack (bec. of module hot reloading)
    if(!brushesSrcImage) init();

    export let spriteID: string;

    let s_sprite = $resourceManager.getResourceStore(spriteID) as Writable<Sprite>;
    
    let canvasWidth = $s_sprite.canvas?.width || 60;
    let canvasHeight = $s_sprite.canvas?.height || 60;
    // reactively create a canvas in sprite and/or update it's width/height
    $: {
        if(!$s_sprite.canvas) {
            $s_sprite.canvas = document.createElement("canvas");
        }
        if($s_sprite.canvas.width != canvasWidth) $s_sprite.canvas.width = canvasWidth;
        if($s_sprite.canvas.height != canvasHeight) $s_sprite.canvas.height = canvasHeight;

        $s_sprite.autoCalculateBBox();
        console.log("recalc bbox")
    }
    let zoomLevel = 2
    $: canvasDisplayWidth = adjustedCanvasSize(canvasWidth) * zoomLevel;
    $: canvasDisplayHeight = adjustedCanvasSize(canvasHeight) * zoomLevel;

    // load brushes
    let brushes = [] as HTMLCanvasElement[];
    const brushWidth = brushesSrcImage.height;
    const numberOfIcons = ~~(brushesSrcImage.width / brushWidth);
    // const iconDisplayWidth =  brushWidth / window.devicePixelRatio * Math.round(window.devicePixelRatio);
    const iconDisplayWidth = adjustedCanvasSize(brushWidth);
    
    brushes.length = numberOfIcons; // hack lol (makes svelte generate html as if there were this many icons)

    // redraw brushes, reactivly
    $: {
        for(let i = 0; i < numberOfIcons; i++) {
            if(!brushes[i]) break;
            // let brushCanvas = document.createElement("canvas");
            let brushCanvas = brushes[i];
            brushCanvas.width = brushCanvas.height = brushWidth;
            let ctx = brushCanvas.getContext("2d")!;
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(brushesSrcImage, i * brushWidth, 0, brushWidth, brushWidth, 0, 0, brushWidth, brushWidth);
            
            brushes[i] = brushCanvas; // reactivity?

            // display width accounts for device pixel ratio
            brushCanvas.style.width = brushCanvas.style.height = iconDisplayWidth + "px";
        } 
    }
    
    // let dummyIcon = () => `<canvas width=${~~iconDisplayWidth + "px"} height=${~~iconDisplayWidth + "px"} />`


    $: mainColor = $currentTheme.mainColor
    $: modeIsDark = brightnessFromColor($currentTheme.bgColor) < 128
    $: console.log(brightnessFromColor($currentTheme.bgColor))

    function brightnessFromColor(color: string) {
        let canvas = document.createElement("canvas")
        canvas.width = canvas.height = 1;
        let ctx = canvas.getContext("2d");
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 1, 1);
        let val = ctx.getImageData(0, 0, 1, 1).data;
        let brightness = (val[0] + val[1] + val[2]) / 3;
        return brightness;
    }

    $: colorMode = modeIsDark? "dark" : "light";
    $: tweak = colorUIAdjust[currentColor] == colorMode;


    let canvas: HTMLCanvasElement; // is bound to
    $: canvasCtx = canvas?.getContext("2d")!;

    onMount(() => {
        let ctx = canvas.getContext("2d");
        ctx.fillStyle = "black";
        // document.querySelector(".canvas-container").append($s_sprite.canvas)
        ctx.drawImage($s_sprite.canvas, 0, 0);
    })

    // stroke select
    let currentBrush: HTMLCanvasElement;

    let selectBrush = (i: number) => {
        currentBrush = brushes[i];
    }
    
    onMount(() => selectBrush(0)); // select first
    
    // colors
    let currentCanvasOP: GlobalCompositeOperation = "source-over";
    let currentColor: string;

    let isEraser = (c: string) => c == "#00000000";

    let selectColor = (i: number) => {
        let color = colors[i];
        currentColor = color;
    }

    $: {
        console.log("brush redraw")
        const eraser = isEraser(currentColor);

        for(let brush of brushes) {
            if(!brush) break;
            let ctx = brush.getContext("2d")!;
            ctx.globalCompositeOperation = "source-in";
            ctx.fillStyle = !eraser? currentColor : modeIsDark? '#fff' : '#000'; // TODO not white
            ctx.fillRect(0, 0, brushWidth, brushWidth);
            // main canvas
            currentCanvasOP = eraser? "destination-out" : "source-over";
        }
    }

    onMount(() => selectColor(colors.length - 1));

    // let canvas = elmt.querySelector("canvas");
    // canvasCtx.fillStyle = "black";
    let draw = false;
    let prevX = -1;
    let prevY = -1;
    // let drawRect = (x, y) => ctx.fillRect(x-4, y-4, 8, 8);

    $: spriteCanvas = $s_sprite.canvas;

    let drawStrokeCTX = (x1: number, y1: number, x2: number, y2: number, ctx: CanvasRenderingContext2D) => {
        const scale =  canvas.width / canvasDisplayWidth;
        x1 *= scale; y1 *= scale; x2 *= scale; y2 *= scale;
        x1 = ~~x1; y1 = ~~y1; x2 = ~~x2; y2 = ~~y2;
        let dx = (x2-x1);
        let dy = (y2-y1);
        

        ctx.globalCompositeOperation = currentCanvasOP;

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

    let resetDisplayCanvas = () => {
        if(!canvasCtx) return;
        const op = canvasCtx.globalCompositeOperation;
        canvasCtx.globalCompositeOperation = "copy";
        canvasCtx.drawImage(spriteCanvas, 0, 0);
        canvasCtx.globalCompositeOperation = op;
    }

    let drawStroke = (x1: number, y1: number, x2: number, y2: number) => {
        drawStrokeCTX(x1, y1, x2, y2, spriteCanvas.getContext("2d")); // draw on sprite canvas
        resetDisplayCanvas();
        $s_sprite = $s_sprite // trigger sprite store update
    }

    // TODO these events make me uncomfortable
    // this is ok, because canvas already exists (saved in sprite)
    // but it is not very svelte-like ?
    
    function canvasOnMouseDown(e: MouseEvent) {
        if(e.button != 0) return;
        draw = true; 
        prevX = e.offsetX;
        prevY = e.offsetY;
        drawStroke(prevX, prevY, prevX, prevY);
    }

    function canvasOnMouseMove(e: MouseEvent) { 
        let x = e.offsetX;
        let y = e.offsetY;
        if(draw) {
            drawStroke(prevX, prevY, x, y);
            prevX = x;
            prevY = y;
        } else {
            resetDisplayCanvas();
            drawStrokeCTX(x, y, x, y, canvasCtx);
        }
    }

    function cancelDraw() { 
        draw = false; 
    }

    function canvasLeave() {
        resetDisplayCanvas();
    }

    let canvasContainer: HTMLElement;

    // resize button
    let resizeButtonClick = async() => {
        // make a popup
        let result = await new Promise<any>(resolve =>
        blockingPopup.set({
            componentType: ResizeSpritePopUp as any,
            data: {width: canvasWidth, height: canvasHeight},
            resolve,
        }));

        if(result) {
            canvasWidth = Math.max(1, result.width);
            canvasHeight = Math.max(1, result.height);
            s_sprite.update(s => { 
                s.autoCalculateBBox();
                return s;
            });
        }
    };

    let uploadButtonClick = async() => {
        let element = document.createElement("input");
        element.setAttribute("type", "file");
        element.style.display = "none";
        document.body.appendChild(element);
        element.click();
        // TODO if user clicks cancel this will just never resolve
        let imgFile: File = await new Promise((resolve) => element.addEventListener("change", () => {
            if (element.files && element.files[0]) {
                element.innerHTML = element.files[0].name;
                resolve(element.files[0]);
            } else {
                resolve(null); // doesn't happen probably?
            }
        }));
        document.body.removeChild(element);

        if(imgFile) {
            let reader = new FileReader();
            let readPromise: Promise<ProgressEvent<FileReader>> = new Promise((resolve, reject) => { reader.onload = event => resolve(event); reader.onerror = reject });
            
            reader.readAsDataURL(imgFile);
            let event: ProgressEvent<FileReader> = await readPromise;
            
            let dataUri = event.target.result as string,
            img = document.createElement("img");
            let imgLoadPromise = new Promise(resolve => img.onload = resolve)
            let container = document.createElement("div");
            container.style.position = 'absolute';
            container.style.left = '-9999px';
            document.body.append(container);
            container.append(img);
            img.src = dataUri;
            // let width: number = img.width;
            // let height: number = img.height;
            // let fileSize: number = imgFile.size;

            await imgLoadPromise;

            console.log(`img width: ${img.width} img height: ${img.height}`)
            console.log(`nat width: ${img.naturalWidth} nat height: ${img.naturalHeight}`)
            if(!img.width || !img.height) return; // TODO weird, hacky

            canvasWidth = img.width;
            canvasHeight = img.height;
            s_sprite.update(sprite => {
                const _canvas = sprite.canvas;
                _canvas.width = img.width;
                _canvas.height = img.height;
                sprite.originX = ~~(_canvas.width / 2);
                sprite.originY = ~~(_canvas.height / 2);
                _canvas.getContext("2d").drawImage(img, 0, 0);
                return sprite;
            });

            document.body.removeChild(container);
            
            requestAnimationFrame(() => resetDisplayCanvas()); // TODO this is hacky
        }
    }

    // $: { canvasWidth; canvasHeight; if($s_sprite.canvas && canvas) resetDisplayCanvas(); }

    // let centerOrigin = () => s_sprite.update(sprite => {
    //     sprite.originX = ~~(canvas.width / 2);
    //     sprite.originY = ~~(canvas.height / 2);
    //     return sprite;
    // });

    let showBBox = false;

    function drawBBox() {
        if(!canvasCtx) return;
        canvasCtx.strokeStyle = modeIsDark? "white" : "black";
        canvasCtx.strokeRect(
            $s_sprite.bBoxX + .5, 
            $s_sprite.bBoxY + .5, 
            $s_sprite.bBoxWidth - 1, 
            $s_sprite.bBoxHeight - 1
        );
    }

    $: {
        if(showBBox) {
            resetDisplayCanvas();
            drawBBox();
        } else {
            resetDisplayCanvas();
        }
    }

</script>

<div class="card-settings"> 
    <p>
        <span>size: </span> <span class=size-description>{canvasWidth} x {canvasHeight}</span> 
        <button class=resize on:click={resizeButtonClick}> change </button>
        <!-- <span><button on:click={centerOrigin} class=center-origin>center origin</button></span> -->
    </p>
    <p>
        <button class=upload on:click={uploadButtonClick}> upload image </button>
    </p>
</div>
<div class="toolbar-container">
    <div class="toolbar colors">
        {#each colors as color, i}
            <button 
                on:click={() => selectColor(i)}
                data-id={i} 
                data-eraser={isEraser(color)}
                data-selected={currentColor == color}
                style:background-color={color}
            >
                <canvas width=1 height=1 style:width={iconDisplayWidth}px style:height={iconDisplayWidth}px /> 
            </button>
        {/each}
    </div>
    <div class="toolbar brushes">
        {#each brushes as brush, i}
        <button 
            on:click={() => selectBrush(i)} 
            data-selected={brush == currentBrush} 
            data-id={i}
            style:background-color={tweak? 'var(--off-bg-color)' : ""}
        >
            <canvas bind:this={brushes[i]} style:width={iconDisplayWidth}px style:height={iconDisplayWidth}px></canvas>
        </button>
        {/each}
    </div>
    <div class="toolbar zoom">
        <button 
            on:click={() => zoomLevel = Math.max(zoomLevel - 1, 1)} 
            class="borderless"
        >
            <AtlasIcon id={23} height={24} />
        </button>
        <button 
            on:click={() => zoomLevel = 1} 
            class="borderless"
        >
            <AtlasIcon id={25} height={24} />
        </button>
        <button 
            on:click={() => zoomLevel += 1} 
            class="borderless"
        >
            <AtlasIcon id={24} height={24} />
        </button>
    </div>
</div>
<!-- <div class="canvas-container-container"> -->
<div 
    class="canvas-container" 
    bind:this={canvasContainer}
    on:mouseup={cancelDraw}
    on:mouseleave={cancelDraw}
    style:min-height=0
>
    <canvas 
        width={canvasWidth} 
        height={canvasHeight}
        style:width={canvasDisplayWidth}px
        style:height={canvasDisplayHeight}px
        bind:this={canvas}
        on:mouseup={cancelDraw}
        on:mousedown={canvasOnMouseDown}
        on:mousemove={canvasOnMouseMove}
        on:mouseleave={canvasLeave}
    ></canvas>
</div>

<p on:mouseenter={() => showBBox = true} on:mouseleave={() => showBBox = false} style:font-size="small">
    bounds: {$s_sprite.bBoxX} {$s_sprite.bBoxY} {$s_sprite.bBoxWidth} {$s_sprite.bBoxHeight}
</p>

<style>
    .toolbar {
        /* margin-top: 6px; */
        margin-bottom: 6px;
        /* width: 100%; */
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        /* justify-content: space-between; */
        justify-content: center;
        gap: 4px;
    }

    .toolbar button {
        padding: 3px;
        display: block;
        /* padding: 0; */
        /* padding-bottom: 2px; */
    }
    .toolbar.colors button[data-eraser="true"] {
        background: var(--stripey-gradient);
    }

    .toolbar canvas{
        display: block;
    }
    
    .toolbar-container {
        display: flex;
        flex-direction: column; /* hack: changed in js */ 
        flex-wrap: wrap;
        column-gap: 16px;
        justify-content: center;
    }

    .canvas-container {
        flex: 1 1;
        display: flex;
        overflow: auto;
    }

    .card-settings {
        padding-left: 8px;
        padding-right: 8px;
    }

    .card-settings>p {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }
    .card-settings>p>* {
        font-size: small;
        display: inline-block;
        flex-grow: 1;
    }
</style>