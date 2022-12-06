<script lang="ts">
    import type { CardInstance } from "../modules/cardManager";
    import Behaviour from "../modules/structs/behaviour";
    import { resourceManager } from "../modules/game/ResourceManager";
    import Sprite from "../modules/structs/sprite";
    import Card from "./Card.svelte";

    export let card: CardInstance;
    let uuid = card.uuid;

    console.log(`open behaviour ${card.uuid}`);

    
    let behaviour: Behaviour;
    let sprite: Sprite|null;
    const isIndependent = !card.uuid.includes("/");
    
    $: {
        if(isIndependent) {
            sprite = null;
            behaviour = $resourceManager.getResourceOfType(uuid, Behaviour) as Behaviour;
        } else {
            let [spriteUUID, behaviourUUID] = uuid.split("/");
            
            sprite = $resourceManager.getResourceOfType(spriteUUID, Sprite) as Sprite;
            behaviour = 
            sprite.behaviours.find(x => x.uuid == behaviourUUID)
            ;
        }
    }
    
    $: {
        card.name = isIndependent?
            `script / ${behaviour.name}`
        : 
            `${sprite.name} / ${behaviour.name}`
        ; 
        $resourceManager; // $resourceManager added for reactivity
    }

    $: card.className = "behaviour-editor"
    $: card.position.width = 450;
</script>


<Card autoFocus={true} contentMinWidth={240} {card}>
    <svelte:component this={behaviour.svelteComponent} {behaviour}></svelte:component>
</Card>