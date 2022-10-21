
<script lang="ts">
import { onMount } from "svelte";
import { cards, type CardInstance } from "../modules/cardManager";

    export let card: CardInstance;
    $: uuid = card.uuid;
    $: name = card.name;
    $: windowType = card.className || "";

    export let autoFocus = true;
    export let contentMinWidth = 90; // px

    function closeWindow() {
        cards.remove(card.uuid);
    };

    function focusWindow() {
        cards.focus(card.uuid);
    }

    // window stuff, rezizable stuff etc.:

    // these update automatically (using a bind: thingy)
    let clientWidth = card.position.width;
    let clientHeight = card.position.height;

    $: console.log(`width: ${clientWidth}`)
    $: console.log(`height: ${clientHeight}`)
    // $: name = `${clientWidth} ${clientHeight}`;
    $: {
        clientWidth; clientHeight;
        // console.log(`card pos: ${card.position.width} ${card.position.width}`)
    }


    // let width: number;
    // let height: number;
    let left: number = card.position.x;
    let top: number = card.position.y;
    let width: number = card.position.width || undefined;
    let height: number = card.position.height || undefined;

    $: { 
        card.position = new DOMRect(left, top, width, height); 
        // console.log("card updated"); 
        // console.log(`: ${card.position.width} ${card.position.height}`)
    }

    let elmt : HTMLElement | null = null;

    export let isMaximized: boolean = card.isMaximized;
    $: card.isMaximized = isMaximized;

    function maxWindow(): void {
        if(!elmt) return;
        isMaximized = !isMaximized;
        focusWindow();
    };


    onMount(() => {     
        console.log("new card elmt")
        if(elmt && autoFocus) {
            elmt.focus()
        }
    });

    const handleQuery = "h3,h3 *,.inner-card";

    let isDragged = false;
    let offsetX = 0;
    let offsetY = 0;

    function onMouseDown(event: MouseEvent) {
        if(!event.target || !(event.target instanceof HTMLElement) || !event.target.matches(handleQuery)) {
            return;
        }

        if(event.target.matches("button")) return;

        cards.focus(uuid);

        if(isMaximized) {
            return;
        }

        
        isDragged = true;

        let rect = elmt!.getBoundingClientRect();
        offsetX = rect.left - event.clientX;
        offsetY = rect.top - event.clientY;
    }

    function onBodyMouseMove(event: MouseEvent) {
        if(isDragged) {
            let origin = document.querySelector("main")!.getBoundingClientRect();
            let l = event.clientX + offsetX - origin.x;
            let t = event.clientY + offsetY - origin.y;
            left = Math.max(0, l);
            top = Math.max(0, t);
        }
    }
    
    function onBodyMouseUp(event: MouseEvent) {
        isDragged = false;
    }

    let initialX = 0;
    let initialY = 0;

    let initialPos = null;
    
    let resizeLeft = false;
    let resizeRight = false;
    let resizeTop = false;
    let resizeBottom = false;

    function onResizeMouseDown(event: MouseEvent){
        let target = (event.target as HTMLElement);
        resizeRight = target.classList.contains("right");
        resizeLeft = !isMaximized && target.classList.contains("left");
        resizeTop = !isMaximized && target.classList.contains("top");
        resizeBottom = !isMaximized && target.classList.contains("bottom");
        
        initialX = event.clientX;
        initialY = event.clientY;
        initialPos = elmt.getBoundingClientRect();
    }
    
    function onResizeMouseMove(event: MouseEvent){
        let offset = document.querySelector("main").getBoundingClientRect();

        if(resizeRight) {
            width = initialPos.width + (event.clientX - initialX);
            width = Math.max(width, 20);
        }
        if(resizeBottom) {
            height = initialPos.height + (event.clientY - initialY);
            height = Math.max(height, 20);
        }
        if(resizeLeft) {
            left = initialPos.left + (event.clientX - initialX) - offset.left;
            left = Math.max(left, 0);
            left = Math.min(left, initialPos.left - offset.left + initialPos.width - 20);

            width = initialPos.width - (left - initialPos.left + offset.left);
        }
        if(resizeTop) {
            top = initialPos.top + (event.clientY - initialY) - offset.top;
            top = Math.max(top, 0);
            top = Math.min(top, initialPos.top - offset.top + initialPos.height - 20);

            height = initialPos.height - (top - initialPos.top + offset.top);
        }
    }

    function onResizeMouseUp(event: MouseEvent){
        resizeLeft = false;
        resizeRight = false;
        resizeTop = false;
        resizeBottom = false;
    }


</script>

<svelte:body
on:mousemove={onBodyMouseMove}
on:mousemove={onResizeMouseMove}
on:mouseup={onBodyMouseUp}
on:mouseup={onResizeMouseUp}
on:mouseleave={onBodyMouseUp}
on:mouseleave={onResizeMouseUp}
></svelte:body>

<!-- 
style:width={isMaximized? "100%" : (clientWidth? `${(clientWidth)}px` : null)}
style:height={isMaximized? "100%" : (clientHeight? `${(clientHeight)}px` : null)} 
style:width={ clientWidth? `${(clientWidth)}px` : undefined }
style:height={ clientHeight? `${(clientHeight)}px` : undefined } 


style:resize={isMaximized? 'none' : 'both'}
bind:clientWidth={clientWidth}
bind:clientHeight={clientHeight}
-->

<section 
class={`card ${windowType || ''}`} 
data-resource-uuid={uuid} 
bind:this={elmt}
tabindex=-1
style:z-index={card.zIndex}
style:position={isMaximized? 'static' : 'absolute'}
style:left={left}px
style:top={top}px
style:width={width}px
style:height={isMaximized? "100%" : `${height}px`}
on:mousedown={onMouseDown}
style="--border: {7 / devicePixelRatio}px; --half-border: {3 / devicePixelRatio}px;"
>
    <div on:mousedown={onResizeMouseDown} class:resize={true} class="right"></div>
    <div on:mousedown={onResizeMouseDown} class:resize={!isMaximized} class="left"></div>
    <div on:mousedown={onResizeMouseDown} class:resize={!isMaximized} class="top"></div>
    <div on:mousedown={onResizeMouseDown} class:resize={!isMaximized} class="bottom"></div>
    <div on:mousedown={onResizeMouseDown} class:resize={!isMaximized} class="top right"></div>
    <div on:mousedown={onResizeMouseDown} class:resize={!isMaximized} class="top left"></div>
    <div on:mousedown={onResizeMouseDown} class:resize={!isMaximized} class="bottom right"></div>
    <div on:mousedown={onResizeMouseDown} class:resize={!isMaximized} class="bottom left"></div>

    <div class="inner-card">
        <h3>
            <div class="name">{name}</div> 
            <div class="buttons">
                <button class="maxWindow" on:click={maxWindow}>
                    { isMaximized? "❐" : "☐" }
                </button>
                <button class="closeWindow" on:click={closeWindow}>🞩</button>
            </div>
        </h3>
        <div class=content style:min-width={contentMinWidth}px>
            <slot></slot>
        </div>
    </div>
</section>


<style>

    /* * {
        --border: 7px;
        --half-border: 3px;
    } */

    section {
        max-width: calc(100% - 8px);
        max-height: calc(100% - 8px);
        margin: 0;

        display: grid;
        grid-template-columns: var(--border) 1fr var(--border);
        grid-template-rows: var(--border) 1fr var(--border);
    }

    .resize {
        /* defaults */
        grid-row: 2;
        grid-column: 2;
        border: var(--half-border) solid var(--bg-color);
        background-color: var(--main-color);
    }

    .resize.top { grid-row: 1; }
    .resize.bottom { grid-row: 3; }
    .resize.left { grid-column: 1; }
    .resize.right { grid-column: 3; }

    .resize.left { cursor: w-resize;}
    .resize.right { cursor: e-resize;}
    .resize.top { cursor: n-resize;}
    .resize.bottom { cursor: s-resize;}
    .resize.top.left { cursor: nw-resize;}
    .resize.top.right { cursor: ne-resize;}
    .resize.bottom.left { cursor: sw-resize;}
    .resize.bottom.right { cursor: se-resize;}

    * {
        box-sizing: border-box;
    }

    .inner-card {
        
        grid-row: 2;
        grid-column: 2;

        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
        max-height: 100%;
        overflow: hidden;
        /* border: 8px solid transparent; */
        /* border-image: var(--corner-image) 8 8 repeat; */
        /* border-color: var(--main-color); */
        /* border-image: image(url("/engineAssets/corners.png"), var(--bg-color)) 8 8 repeat; */
        padding: 0;
        margin: 0;
    }

    .content {
        padding: 4px;
        flex-grow: 1;
        flex-shrink: 1;
        min-height: 0;
        flex-direction: column;
        display: flex;
    }

    h3 {
        margin-top: 0px;
        margin-bottom: 10px;
        border-bottom: 1px solid var(--main-color);

        display: flex; 
        flex-direction: row; 
        justify-content: space-between;
        align-items: center;

        color: var(--main-color);
        background-color: var(--bg-color);
    }

    h3>div {
        height: 100%;
    }

    .name {
        padding: 5px;
        padding-bottom: 7px;
        font-size: 90%;
        flex: 1 1;
        min-width: 0;
        overflow: hidden;
    }

    .buttons {
        display: flex;
        flex-direction: row;
    }

    button {
        border: none;
        /* background-color: var(--bg-color); */
        color: var(--main-color);
        /* border: 1px solid var(--bg-color); */
        background: none;
        padding: 0;
        padding-bottom: 2px;
        margin: 0;
        box-shadow: none;

        width: 28px;
        height: 100%;
        display: block;

        /* display: inline-block;
        vertical-align: top; */
        /* margin-top: -5px;
        padding-left: 4px; */
        /* padding-left: 8px; */
    }

    button:hover {
        color: var(--main-color);
        background-color: var(--off-bg-color);
    }



    :global(*) {
        scrollbar-color: var(--off-bg-color) var(--bg-color);
    }

    :global(::-webkit-scrollbar) {
        /* display: none; */
        background-color: var(--bg-color);
        color: var(--main-color);
        width: 16px;
        height: 16px;

    }

    /* disable 'double buttons' */
    :global(::-webkit-scrollbar-button:vertical:start:increment,
    ::-webkit-scrollbar-button:vertical:end:decrement,
    ::-webkit-scrollbar-button:horizontal:start:increment, 
    ::-webkit-scrollbar-button:horizontal:end:decrement)
    {
        display: none;
    }

    :global(::-webkit-scrollbar-button:hover, ::-webkit-scrollbar-thumb:hover) {
        background-color: var(--off-bg-color);
    }
    :global(::-webkit-scrollbar-button:active, ::-webkit-scrollbar-thumb:active) {
        background-color: var(--neutral-color);
    }
    :global(::-webkit-scrollbar-button:vertical:decrement) { background-image: url("up-arrow.svg"); }
    :global(::-webkit-scrollbar-button:vertical:increment) { background-image: url("down-arrow.svg"); }
    :global(::-webkit-scrollbar-button:horizontal:decrement) { background-image: url("left-arrow.svg"); }
    :global(::-webkit-scrollbar-button:horizontal:increment) { background-image: url("right-arrow.svg"); }
    
    :global(::-webkit-scrollbar-button) {
        /* background-color: var(--off-bg-color); */
        color: var(--main-color);
        height: 1em;
        width: 16px;
        height: 16px;
    }

    :global(::-webkit-scrollbar-track) { /* Background */
        background-color: var(--bg-color);
    }

    :global(::-webkit-scrollbar-thumb) { /* Foreground */
        background-color: var(--off-bg-color);
    }

    :global(::-webkit-scrollbar-corner) {
        background-color: var(--bg-color);
    }



</style>