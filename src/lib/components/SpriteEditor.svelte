<script lang="ts">
import type { CardInstance } from "../modules/cardManager";
import { resourceManager } from "../modules/game/ResourceManager";
import type Sprite from "../modules/structs/sprite";
import Card from "./Card.svelte";
import ImageEditor from "./ImageEditor.svelte";

    export let card: CardInstance;

    console.log(`open sprite ${card.uuid}`);
    let sprite: Sprite = $resourceManager?.findByUUID(card.uuid) as Sprite;
    $: {card.name = sprite.name; $resourceManager;} // $resourceManager added for reactivity
    $: card.className = "sprite-editor"

    let script1Text = sprite.initCode; // TODO different events
    let script2Text = sprite.updateCode; // TODO different events
    
    $: sprite.initCode = script1Text;
    $: sprite.updateCode = script2Text;

    let mode: "draw" | "script1" | "script2" = "draw";

</script>

<Card autoFocus={true} contentMinWidth={240} {card}>
    <div class="modes">
        <button on:click={() => mode = "draw" } class:selected={mode == "draw"}>drawing</button>
        <button on:click={() => mode = "script1" } class:selected={mode == "script1"}>init code</button>
        <button on:click={() => mode = "script2" } class:selected={mode == "script2"}>update code</button>
    </div>
    {#if mode=="draw"}
    <ImageEditor spriteID={sprite.uuid}/>
    <!-- </div> -->
    <!-- <div class="frame-select"><input step=1 min=0 max=4 type="range" /></div> -->
    {:else if mode == "script1"}
    <textarea bind:value={script1Text} spellcheck=false></textarea>
    {:else if mode == "script2"}
    <textarea bind:value={script2Text} spellcheck=false></textarea>
    {/if}
</Card>

<style>
    .modes {
        margin-bottom: 8px;
        border-bottom: 1px solid let(--main-color);
    }

    .modes button {
        box-shadow: none;
        border-bottom: none;
        padding-bottom: 4px;
    }

    .modes button.selected {
        border-bottom: none;
        box-shadow: 0px 2px let(--bg-color);
    }

    textarea {
        flex-grow: 1;
        overflow-wrap: normal;
        /* white-space: pre; */
        /* overflow: scroll; */
    }

    /* TODO make non-global, but will have to restructure canvas stuff  */
    :global(.card.sprite-editor .canvas-container canvas) {
        display: block;
        margin: auto;
        border: 1px solid var(--main-color);
        background-color: var(--stripey-gradient);
        
        /* overflow: hidden; */
        /* flex-grow: 1; */
        /* object-fit:none ; */
        background: var(--stripey-gradient);
    }
</style>