
<script lang="ts">
import { getContext, onMount } from "svelte";
import { bringToFront, cards, type CardInstance } from "../modules/cardManager";
import ResourceManager, { resourceManager } from "../modules/game/ResourceManager";
import { bounce } from "../transitions";
import AtlasIcon from "./AtlasIcon.svelte";

    export let card: CardInstance;
    $: uuid = card.uuid;
    $: windowType = card.className || "";

    export let autoFocus = true;
    export let contentMinWidth = 90; // px
    export let contentMaxWidth = 1000; // px // TODO could be smaller / can do this differently, but low prio
    export let hasCornerButtons = true;
    export let namePrefix = "";

    $: resourceStore = ($resourceManager as ResourceManager).getResourceStore(uuid);

    function closeWindow() {
        cards.remove(card.uuid);
    };

    function focusWindow() {
        // cards.focus(card.uuid);
        bringToFront(card);
    }

    let getCardsBounds = getContext<() => HTMLElement|null>("getCardsBounds");

    // window stuff, rezizable stuff etc.:

    // these update automatically (using a bind: thingy)
    let clientWidth = card.position.width;
    let clientHeight = card.position.height;

    // $: console.log(`width: ${clientWidth}`)
    // $: console.log(`height: ${clientHeight}`)
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

    let focusCounter = 0; // hack
    $: card.onFocus = () => { if(!elmt) return; elmt.focus(); elmt.scrollIntoView(); focusCounter++; };

    export let isMaximized: boolean = card.isMaximized;
    $: card.isMaximized = isMaximized;

    function maxWindow(): void {
        if(!elmt) return;
        isMaximized = !isMaximized;
        focusWindow();
    };


    onMount(() => {     
        // console.log("new card elmt")
        if(elmt && autoFocus) {
            elmt.focus()
        }
    });

    const handleQuery = "h3,h3 *,.inner-card";

    let isDragged = false;
    let offsetX = 0;
    let offsetY = 0;

    function onMouseDown(event: MouseEvent) {
        if(event.button != 0) return;
        if(!event.target || !(event.target instanceof HTMLElement) || !event.target.matches(handleQuery)) {
            return;
        }

        if(event.target.matches("button")) return;

        bringToFront(card);

        if(isMaximized) {
            return;
        }

        
        isDragged = true;

        let rect = elmt.getBoundingClientRect();
        offsetX = rect.left - event.clientX;
        offsetY = rect.top - event.clientY;
    }

    function onBodyMouseMove(event: MouseEvent) {
        if(isDragged) {
            let bounds = getCardsBounds();
            if(!bounds) return;
            let origin = bounds.getBoundingClientRect();
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
        if(event.button != 0) return;
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
        let bounds = getCardsBounds();
        if(!bounds) return;
        let offset = bounds.getBoundingClientRect();

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


    let editResourceName = false;
    let resourceNameInputElement: HTMLElement|null = null;
    $: {
        // auto focus
        if(resourceNameInputElement != null) resourceNameInputElement.focus();
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

    {#key focusCounter}
    <div class="inner-card" in:bounce={{duration: 300}}>
        <h3>
            <div class="name" >
                {namePrefix}
                {#if resourceStore != null}
                    {#if editResourceName}
                        <input 
                            type="text"
                            size=15
                            bind:value={$resourceStore.name} 
                            bind:this={resourceNameInputElement}
                            on:focusout={() => editResourceName = false}    
                            on:keydown={(ev) => {if(ev.key=="Enter" || ev.key=="Escape") editResourceName = false}}
                        />
                    {:else}
                    <button 
                        class="borderless"
                        name="edit" 
                        on:click={() => editResourceName = !editResourceName}
                    >
                        {$resourceStore.name} <span style:font-size="1rem">✏️</span>
                    </button>
                    {/if}
                {:else}
                    {card.name}
                {/if}
            </div> 
            {#if hasCornerButtons}
            <div class="buttons">
                <button class="maxWindow borderless" on:click={maxWindow}>
                    <!-- { isMaximized? "❐" : "☐" } -->
                    {#if isMaximized}
                        <AtlasIcon id={19} height={20}></AtlasIcon>
                    {:else}
                        <AtlasIcon id={20} height={20}></AtlasIcon>
                    {/if}
                </button>
                <!-- <button class="closeWindow" on:click={closeWindow}>🞩</button> -->
                <button class="closeWindow borderless" on:click={closeWindow}>
                    <AtlasIcon id={32} height={20}></AtlasIcon>
                </button>
            </div>
            {/if}
        </h3>
        <div class=content style:min-width={contentMinWidth}px style:max-width={contentMaxWidth}px>
            <slot></slot>
        </div>
    </div>
    {/key}
</section>


<style>

    /* * {
        --border: 7px;
        --half-border: 3px;
    } */
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
    
    section {
        /* max-width: calc(100% - 8px);
        max-height: calc(100% - 8px); */
        /* min-width: max-content; */
        margin: 0;

        display: grid;
        grid-template-columns: var(--border) 1fr var(--border);
        grid-template-rows: var(--border) 1fr var(--border);

        position: absolute;
        user-select: none;

        /* resize: both; */
        overflow: hidden;
        /* min-width: fit-content;
        min-height: fit-content; */
        /* padding: -8px; */
        /* border: 2px solid var(--main-color); */
        /* box-shadow: 2px 2px 8px -2px var(--main-color); */
        background-color: var(--bg-color);
        width: fit-content;
        height: fit-content;
        max-height: 100%;
        /* padding: 8px; */
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
        flex: 1 1;
        min-width: 0;
        height: 2.5rem;
        overflow: hidden;
    }

    .name, .name input, .name button {
        font-size: 1.125rem;
    }

    .name, .name input, .name button {
        display: inline-block;
        width: fit-content;
    }

    .buttons {
        display: flex;
        flex-direction: row;
    }

    button {
        width: 28px;
        height: 100%;
        display: block;
    }

</style>