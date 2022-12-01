<script lang="ts">
    import type { CardInstance } from "../modules/cardManager";
    import Behaviour from "../modules/game/behaviour";
    import { resourceManager } from "../modules/game/ResourceManager";
    import Card from "./Card.svelte";

    export let card: CardInstance;

    console.log(`open behaviour ${card.uuid}`);
    let behaviour = $resourceManager.getResourceOfType(card.uuid, Behaviour) as Behaviour;

    $: {card.name = behaviour.name; $resourceManager;} // $resourceManager added for reactivity
    $: card.className = "behaviour-editor"
    $: card.position.width = 450;
</script>


<Card autoFocus={true} contentMinWidth={240} {card}>
    <svelte:component this={behaviour.svelteComponent} {behaviour}></svelte:component>
</Card>