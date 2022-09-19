
<script lang="ts">
import { onMount } from "svelte";

import type { AbstractButton, AbstractPrompt } from "../modules/ui";

    export let prompt: AbstractPrompt|null;

    function buttonClick(button: AbstractButton) {
        console.log("click")
        button.callback();
        prompt = null;
    }

    onMount(() => {

    });
</script>

{#if prompt}
    <div class="overlay">
        <div class="popup">
            <p>{prompt.text}</p>
            <slot></slot>
            <ul class=horizontal>
                {#each prompt.buttons as but}
                <li><button on:click={ () => buttonClick(but) }>{but.text}</button></li>
                {/each}
            </ul>
        </div>
    </div>
{/if}