<script lang="ts">
import { blockingPopup } from "../modules/ui";
import { cards, openCard } from "./../modules/cardManager";
import Resources from "./Resources.svelte";

    openCard(Resources, false)

    $: sortedCards = $cards.sort((a, b) => (a.position.x - b.position.x));
</script>

<main>
    {#each sortedCards as card (card.uuid)}
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
        align-items: top;
        gap: 4px;
        
        overflow: hidden;
        position: relative;

        padding: 0;
    }
</style>