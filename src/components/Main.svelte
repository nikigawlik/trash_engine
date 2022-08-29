<script lang="ts">
import { blockingPopup } from "../modules/ui";
import { cards } from "./../modules/cardManager";
</script>

<main>
    {#each $cards as card}
        <svelte:component this={card.componentType} card={card} />
    {/each}
    {#if $blockingPopup}
        <svelte:component this={$blockingPopup.componentType} bind:prompt={$blockingPopup} />
    {/if}
</main>