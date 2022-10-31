<script lang="ts">
    import { setContext } from "svelte";
import { blockingPopup } from "../modules/ui";
import { cards, openCard } from "./../modules/cardManager";
import Resources from "./Resources.svelte";

    openCard(Resources, false)

    $: sortedCards = $cards.sort((a, b) => (a.position.x - b.position.x));

    let boundsElmt = null;

    setContext("getCardsBounds", () => boundsElmt);
</script>

<main>
    <div class=cards bind:this={boundsElmt}>
        {#each sortedCards as card (card.uuid)}
            <svelte:component this={card.componentType} card={card} />
        {/each}
    </div>
    {#if $blockingPopup}
        <svelte:component this={$blockingPopup.componentType} bind:prompt={$blockingPopup} />
    {/if}
</main>

<style>
    .cards {
        height: 100%;
        width: max-content;
        display: flex;
        justify-content: left;
        align-items: top;
        gap: 4px;
    }
    main {
        /* width: 100vw; */
        /* height: 100vh; */
        flex-grow: 1;

        
        overflow: hidden;
        overflow-x: scroll;
        position: relative;
        flex-grow: 1;

        padding: 0;
    }
</style>