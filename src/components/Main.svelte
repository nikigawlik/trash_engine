<script lang="ts">
import type { SvelteComponent } from "svelte/internal";

import { cards, CardType } from "./../modules/cardManager";
import Card from "./Card.svelte";

export function openCard(type: any, allowDuplicate: boolean = true) {
    
    // either an existing card or false/undefined
    let existing = !allowDuplicate && $cards.find(x => x.componentType === type);
    
    if(existing) {
        cards.focus(existing.uuid);
    } else {   
        cards.add(type, "");
    }
}

</script>

<main>
    {#each $cards as card}
        <svelte:component this={card.componentType} card={card}/>
    {/each}
</main>