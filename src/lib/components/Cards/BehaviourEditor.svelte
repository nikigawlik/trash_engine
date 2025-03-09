<script lang="ts">
    import { Readable, Writable } from "svelte/store";
    import type { CardInstance } from "../../modules/cardManager";
    import { gameData } from "../../modules/game/game_data";
    import { asStore } from "../../modules/store_owner";
    import Behaviour from "../../modules/structs/behaviour";
    import BehaviourLink from "../../modules/structs/behaviourLink";
    import Sprite from "../../modules/structs/sprite";
    import Card from "../Card.svelte";

    export let card: CardInstance;
    let uuid = card.uuid;

    console.log(`open behaviour ${card.uuid}`);

    
    let behaviour: Writable<Behaviour>;
    let sprite: Readable<Sprite> | null = null; // a bit weird, but works
    
    const isIndependent = !card.uuid.includes("/");

    $: {
        if($gameData) {
            let b: Behaviour = null;

            if(isIndependent) {
                b = $gameData.getResource(uuid, Behaviour)
            } else {
                let [spriteUUID, behaviourUUID] = uuid.split("/");
                sprite = asStore($gameData.getResource(spriteUUID, Sprite))
                let b = $sprite.behaviours.find(x => x.uuid == behaviourUUID);
                if(b instanceof BehaviourLink)
                    b = $gameData.getResource(b.linkedBehaviourUUID, Behaviour)
            }
            behaviour = asStore(b || $gameData.getAllOfResourceType(Behaviour)[0]);
        }
    }
    
    $: {
        card.name = isIndependent?
            `script / ${$behaviour?.name}`
        : 
            `${$sprite?.name} / ${$behaviour?.name}`
        ; 
    }

    // $: card.position.width = ($behaviour.svelteComponent instanceof BCustom)? 450 : 200;

    // $: {
    //     console.log($behaviour);
    // }

</script>


<Card 
    autoFocus={true} 
    contentMinWidth={40} 
    {card} 
    namePrefix="edit behaviour: "
    resourceNeeded={$behaviour? null : {resourceConstructor: Behaviour, displayName: "behaviour"}}
>
    {#if isIndependent}
    <p>(this behaviour/script needs to be added to a sprite to run)</p>
    {/if}
    {#if $behaviour}
        <svelte:component this={$behaviour.svelteComponent} bind:behaviour={$behaviour}></svelte:component>
    {/if}
</Card>


<style>
    p {
        font-style: italic;
        font-size: smaller;
    }
</style>
