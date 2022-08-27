
<script lang="ts">
import { setupDraggable } from "../modules/ui";
import { createEventDispatcher } from "svelte";
import { onMount } from "svelte";
import { cards, type CardInstance } from "../modules/cardManager";

    export let card: CardInstance;
    $: uuid = card.uuid;
    $: name = card.name;
    $: windowType = card.className || "";

    let clientWidth = 200;
    let clientHeight = 200;
    // $: name = `${clientWidth} ${clientHeight}`;
    

    function closeWindow() {
        cards.remove(card.uuid);
    };

    function focusWindow() {
        cards.focus(card.uuid);
    }

    // click
    let memory: { width: any; height: any; left: any; top: any; } | null = null;
    let elmt : HTMLElement | null = null;

    let isMaximized: boolean = false;

    function maxWindow(): void {
        if(!elmt) return;
        isMaximized = !isMaximized;
        if(isMaximized) {
            focusWindow();
            let rect = elmt.getBoundingClientRect();
            memory = { 
                width: elmt.style.width || rect.width + "px", 
                height: elmt.style.height || rect.height + "px", 
                left: elmt.style.left, 
                top: elmt.style.top 
            };
            
            elmt.style.position = "static";
            elmt.style.width = "100%";
            elmt.style.height = "100%";
            elmt.style.resize = "none";
        } else {
            if(memory) {
                elmt.style.width = memory.width;
                elmt.style.height = memory.height;
                elmt.style.left = memory.left;
                elmt.style.top = memory.top;
                elmt.style.resize = "both";
                elmt.style.position = "absolute";
                memory = null;
            }
        }
    };


    onMount(() => {     
        console.log("new card elmt")

        if(elmt) setupDraggable(elmt, {
            boundsElement: document.querySelector("main") as HTMLElement, 
            handleQuery: "h3,h3 *,.inner-card", 
            snap: 1
        });
    });
    // cards.push(elmt);
</script>

<section 
class={`card ${windowType || ''}`} 
data-resource-uuid={uuid} 
bind:this={elmt}
bind:clientWidth={clientWidth} 
bind:clientHeight={clientHeight}
>
    <div class="inner-card">
        <h3>
            <span class="name">{name}</span> 
            <span>
                <button class="maxWindow" on:click={maxWindow}>
                    { isMaximized? "❐" : "☐" }
                </button>
                <button class="closeWindow" on:click={closeWindow}>🞩</button>
            </span>
        </h3>
        <slot></slot>
    </div>
</section>