
<script lang="ts">
import type { AbstractPrompt } from "../modules/ui";
import BlockingPopUp from "./BlockingPopUp.svelte";

    export let prompt: AbstractPrompt|null;

    export let width: number = prompt?.data.width;
    export let height: number = prompt?.data.height;
    
    $: if(prompt) prompt.buttons = [
        {text: "ok", callback: () => prompt?.resolve({ width, height })},
        {text: "cancel", callback: () => prompt?.resolve(null)},
    ]
</script>


<BlockingPopUp bind:prompt={prompt}>
    <p>This will <em>erase</em> your drawing!!!</p>
    <p><label> width: <input bind:value={width} /></label></p>
    <p><label> height: <input bind:value={height} /></label></p>
</BlockingPopUp>