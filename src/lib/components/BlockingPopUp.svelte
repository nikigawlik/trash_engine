
<script lang="ts">
import { onMount } from "svelte";

import type { AbstractButton, AbstractPrompt } from "../modules/ui";

    export let prompt: AbstractPrompt|null;

    $: lines = prompt?.text?.split("\n") || [];

    function buttonClick(button: AbstractButton) {
        console.log("click")
        button.callback();
        prompt = null;
    }

    let targetButton: HTMLButtonElement|null;

    onMount(() => {
        if(targetButton) targetButton.focus();
    })
</script>

{#if prompt}
    <div class="overlay">
        <div class="popup">
            {#each lines as line}
                <p>{line}</p>
            {/each}
            <slot></slot>
            <ul class=horizontal>
                {#each prompt.buttons as but, i}
                {#if but.default}
                    <li><button bind:this={targetButton} on:click={() => buttonClick(but)} disabled={but.disabled} >{but.text}</button></li>
                {:else}
                    <li><button on:click={() => buttonClick(but)} disabled={but.disabled} >{but.text}</button></li>
                {/if}
                {/each}
            </ul>
        </div>
    </div>
{/if}

<style>
    .overlay {
        position: absolute;
        left: 0;
        top: 0;
        width: 100vw;
        height: 100vh;
        background-color: rgba(0, 0, 0, 0.41);
        z-index: 10000;

        display: flex;
        justify-content: center;
        align-items: center;
    }
    

    .popup {
        width: fit-content;
        height: fit-content;
        padding: 8px;
        background-color: var(--bg-color);
        margin: auto;

        display: flex;
        flex-direction: column;
        gap: 10px;
    }
    

    .horizontal {
        min-height: 0;
        flex: 1 1 auto;

        display: flex;
        flex-direction: row;
        justify-content: space-between;
        gap: 8px;
    }
</style>