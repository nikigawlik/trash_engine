
<script lang="ts">
import { onMount } from "svelte";
import { cards, type CardInstance } from "../modules/cardManager";

    export let card: CardInstance;
    $: uuid = card.uuid;
    $: name = card.name;
    $: windowType = card.className || "";

    export let autoFocus = true;

    function closeWindow() {
        cards.remove(card.uuid);
    };

    function focusWindow() {
        cards.focus(card.uuid);
    }

    // window stuff, rezizable stuff etc.:
    
    // these update automatically (using a bind: thingy)
    let clientWidth = 200;
    let clientHeight = 200;
    // $: name = `${clientWidth} ${clientHeight}`;

    // let width: number;
    // let height: number;
    let left: number = 0;
    let top: number = 0;

    let elmt : HTMLElement | null = null;

    export let isMaximized: boolean = false;

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
            left = event.clientX + offsetX - origin.x;
            top = event.clientY + offsetY - origin.y;
        }
    }
    
    function onBodyMouseUp(event: MouseEvent) {
        isDragged = false;
    }

</script>

<svelte:body
on:mousemove={onBodyMouseMove}
on:mouseup={onBodyMouseUp}
></svelte:body>

<section 
class={`card ${windowType || ''}`} 
data-resource-uuid={uuid} 
bind:this={elmt}
bind:clientWidth={clientWidth} 
bind:clientHeight={clientHeight}
tabindex=-1
style:z-index={card.zIndex}
style:height={isMaximized? "100%" : null}
style:left={left}px
style:top={top}px
style:resize={isMaximized? 'none' : 'both'}
style:position={isMaximized? 'static' : 'absolute'}
on:mousedown={onMouseDown}
>
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
        <slot></slot>
    </div>
</section>


<style>    
    * {
        box-sizing: border-box;
    }

    .inner-card {
        box-sizing: border-box;
        display: flex;
        flex-direction: column;;
        width: 100%;
        height: 100%;
        border: 1px solid var(--main-color);
        /* border: 8px solid transparent; */
        /* border-image: var(--corner-image) 8 8 repeat; */
        /* border-color: var(--main-color); */
        /* border-image: image(url("/engineAssets/corners.png"), var(--bg-color)) 8 8 repeat; */
        padding: 0;
        margin: 0;
    }


    h3 {
        margin-top: 0px;
        margin-bottom: 10px;

        display: flex; 
        flex-direction: row; 
        justify-content: space-between;
        align-items: center;

        background-color: var(--main-color);
        color: var(--bg-color);
    }

    h3>div {
        height: 100%;
    }

    .name {
        padding: 5px;
        padding-bottom: 7px;
        font-size: 90%;
    }

    .buttons {
        display: flex;
        flex-direction: row;
    }

    button {
        border: none;
        /* background-color: var(--bg-color); */
        color: var(--bg-color);
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
        background-color: var(--bg-color);
    }

</style>