<script lang="ts">
import { blockingPopup } from "../modules/ui";
import { cards, openCard } from "./../modules/cardManager";
import Resources from "./Resources.svelte";

openCard(Resources, false)
</script>

<main>
    {#each $cards as card (card.uuid)}
        <svelte:component this={card.componentType} card={card} />
    {/each}
    {#if $blockingPopup}
        <svelte:component this={$blockingPopup.componentType} bind:prompt={$blockingPopup} />
    {/if}
</main>

<style>
    main {
        /* width: 100vw; */
        /* height: 100vh; */
        flex-grow: 1;

        display: flex;
        justify-content: left;
        align-items: center;
        gap: 4px;
        
        overflow: hidden;
        position: relative;

        padding: 0;
    }
</style>