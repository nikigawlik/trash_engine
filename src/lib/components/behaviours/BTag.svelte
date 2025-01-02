
<script lang="ts">
    import { gameData } from "../../modules/game/game_data";
    import { isValidVariableName } from "../../modules/game/utils";
    import type Behaviour from "../../modules/structs/behaviour";
    import Sprite from "../../modules/structs/sprite";
    import FResource from "./fields/FResource.svelte";
    
    // export let sprite: Sprite;
    export let behaviour: Behaviour;
    $: behaviour.iconID = 75;

    // $: sprite = $gameData?.getResource(spriteUUID, Sprite)
    
    // let sprites = $gameData.getResourceTypeStore(Sprite);
    
    let spriteUUID = behaviour.data.tagID as string || "";
    let sprite = $gameData.getResource(spriteUUID, Sprite) || null;

    $: behaviour.data = {
        tagID: sprite?.uuid || "",
    }

    // $: behaviour.props = []
    $: console.log(sprite?.name);

    $: if(behaviour) behaviour.props = [];
    $: if(behaviour) behaviour.code = 
        sprite?
        (isValidVariableName(sprite.name)?
            `tag(me, ${sprite.name})`
        :
            `tag(me, "${sprite.uuid}")`
        ) : "";

</script>

<fieldset>
    <p>
        Tagging this sprite as another sprite will make it behave the same
        for the purposes of collision checks and similar, but not copy any of it's behaviours.
    </p>
    <hr />
    <FResource id="tag" resourceType={Sprite} bind:resource={sprite} > other sprite </FResource>
</fieldset>


<style>
    p {
        max-width: 15rem;
    }
</style>