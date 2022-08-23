<script lang="ts">
import { cards } from "src/modules/cardManager";
import Card from "./Card.svelte";

</script>

<main>
    {#each $cards as card}
        <Card on:close={e => cards.remove(e.detail.uuid)} on:focus={e => cards.focus(e.detail.uuid)} uuid={card.uuid}>
            <svelte:component this={card.content}/>
        </Card>
    {/each}
</main>