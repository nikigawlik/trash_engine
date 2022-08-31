<script lang="ts">
import { blockingPopup } from "../modules/ui";
import { cards, openCard } from "./../modules/cardManager";
import Resources from "./Resources.svelte";

openCard(Resources)
</script>

<main>
    {#each $cards as card (card.uuid)}
        <svelte:component this={card.componentType} card={card} />
    {/each}
    {#if $blockingPopup}
        <svelte:component this={$blockingPopup.componentType} bind:prompt={$blockingPopup} />
    {/if}
</main>