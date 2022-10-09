<script lang="ts">
    import type { CardInstance } from "../modules/cardManager";
    import { resourceManager } from "../modules/game/ResourceManager";
    import Card from "./Card.svelte";
    
        export let card: CardInstance;
        $: card.name = "game data";

        let getText = async rm => text = JSON.stringify(await rm.getSerializedData());
        let text = getText(resourceManager.get());
        resourceManager.subscribe(getText);
        
</script>

<Card card={card} autoFocus={false}>
    <p class="log">
        {text}
    </p>
</Card>

<style>
    p {
        flex-grow: 1;
        flex-shrink: 1;
    }
</style>