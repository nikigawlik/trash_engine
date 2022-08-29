<script lang="ts">
import { blockingPopup, PromptType } from "../modules/ui";

import { cards } from "./../modules/cardManager";
import BlockingPopUp from "./BlockingPopUp.svelte";
import GetTextPopUp from "./GetTextPopUp.svelte";
</script>

<main>
    {#each $cards as card}
        <svelte:component this={card.componentType} card={card}/>
    {/each}
    {#if $blockingPopup}
        {#if $blockingPopup.promptType == PromptType.Text}
            <GetTextPopUp bind:prompt={$blockingPopup}></GetTextPopUp>
        {:else}
            <BlockingPopUp bind:prompt={$blockingPopup}></BlockingPopUp>
        {/if}
    {/if}
</main>