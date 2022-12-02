<script lang="ts">
    import type { CardInstance } from "../modules/cardManager";
    import Behaviour from "../modules/game/behaviour";
    import { resourceManager } from "../modules/game/ResourceManager";
    import Sprite from "../modules/structs/sprite";
    import Card from "./Card.svelte";

    export let card: CardInstance;

    console.log(`open behaviour ${card.uuid}`);

    let [spriteUUID, behaviourUUID] = card.uuid.split("/");

    let sprite = $resourceManager.getResourceOfType(spriteUUID, Sprite) as Sprite;
    let behaviour = 
        $resourceManager.getResourceOfType(behaviourUUID, Behaviour) as Behaviour ||
        sprite.behaviours.find(x => (x instanceof Behaviour) && x.uuid == behaviourUUID) as Behaviour
    ;

    $: {card.name = `${sprite.name} / ${behaviour.name}`; $resourceManager;} // $resourceManager added for reactivity
    $: card.className = "behaviour-editor"
    $: card.position.width = 450;
</script>


<Card autoFocus={true} contentMinWidth={240} {card}>
    <svelte:component this={behaviour.svelteComponent} {behaviour}></svelte:component>
</Card>