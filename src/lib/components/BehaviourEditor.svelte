<script lang="ts">
    import { Readable, derived } from "svelte/store";
    import type { CardInstance } from "../modules/cardManager";
    import { gameData } from "../modules/game/game_data";
    import { asStore } from "../modules/store_owner";
    import Behaviour from "../modules/structs/behaviour";
    import Sprite from "../modules/structs/sprite";
    import Card from "./Card.svelte";

    export let card: CardInstance;
    let uuid = card.uuid;

    console.log(`open behaviour ${card.uuid}`);

    
    let behaviour: Readable<Behaviour>;
    let sprite: Readable<Sprite> | null = null; // a bit weird, but works
    
    const isIndependent = !card.uuid.includes("/");

    $: {
        if($gameData)
        if(isIndependent) {
            behaviour = asStore($gameData.getResource(uuid, Behaviour))
        } else {
            let [spriteUUID, behaviourUUID] = uuid.split("/");
            sprite = asStore($gameData.getResource(uuid, Sprite))
            behaviour = derived(sprite, $sprite => $sprite.behaviours.find(x => x.uuid == behaviourUUID))
        }
    }
    
    $: {
        card.name = isIndependent?
            `script / ${$behaviour?.name}`
        : 
            `${$sprite?.name} / ${$behaviour?.name}`
        ; 
    }

    $: card.className = "behaviour-editor"
    $: card.position.width = 450;

    $: {
        console.log($behaviour);
    }
</script>


<Card autoFocus={true} contentMinWidth={240} {card} namePrefix="edit behaviour: ">
    {#if isIndependent}
    <p>(this behaviour/script needs to be added to a sprite to run)</p>
    {/if}
    {#if $behaviour}
        <svelte:component this={$behaviour.svelteComponent} behaviour={$behaviour}></svelte:component>
    {/if}
</Card>


<style>
    p {
        font-style: italic;
        font-size: smaller;
    }
</style>