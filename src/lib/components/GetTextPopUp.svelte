
<script lang="ts">
import { onMount } from "svelte";

import type { AbstractPrompt } from "../modules/ui";
import BlockingPopUp from "./BlockingPopUp.svelte";

    export let prompt: AbstractPrompt|null;
    
    $: if(prompt) prompt.buttons = [
        {text: "ok", callback: () => prompt?.resolve(text)},
        {text: "cancel", callback: () => prompt?.resolve(null)},
    ]

    let text: string = prompt?.data || "";
    let inputElmt: HTMLInputElement | HTMLTextAreaElement;

    $: isBig = text.includes("\n"); // TODO this is hacky & buggy

    onMount(() => {
        inputElmt.focus();
        inputElmt.select();
    });
    
    let onkeyup = (event: KeyboardEvent) => {
        if (event.key == 'Enter') {
            prompt?.resolve(text);
            prompt = null;
        } 
    }
</script>

<BlockingPopUp bind:prompt={prompt}>
    {#if isBig}
        <p><textarea cols={40} bind:value={text} bind:this={inputElmt} on:keyup={onkeyup} /></p>
    {:else}
        <p><input type="text" bind:value={text} bind:this={inputElmt} on:keyup={onkeyup} /></p>
    {/if}
</BlockingPopUp>

<style>
    textarea {
        height: 12rem;
    }
</style>