<script lang="ts">
import type { CardInstance } from "../modules/cardManager";

import type Folder from "../modules/structs/folder";

import ResourceManager, { resourceManager } from "../modules/game/ResourceManager";
import Card from "./Card.svelte";
import ResourceSubTree from "./ResourceSubTree.svelte";
import ResourceTreeResource from "./ResourceTreeResource.svelte";
    import ResourcesFolder from "./ResourcesFolder.svelte";
    import Sprite from "../modules/structs/sprite";
    import Room from "../modules/structs/room";

export let card: CardInstance;
$: card.name = "resources";
$: card.className = "resources";

// let root = resourceManager.get()?.root;
$: sprites = $resourceManager.getSprites();
$: rooms = $resourceManager.getRooms();

</script>

<!-- {@debug folders} -->

<Card {card}>
    <div class="scroll-box">
        <ResourcesFolder displayName="sprites" resourceConstructor={Sprite} />
        <ul class="resources sprites">
            {#each sprites as sprite (sprite.uuid)}
                <li>
                    <ResourceTreeResource selfResource={sprite}></ResourceTreeResource>
                </li>
            {/each}
        </ul>
        <ResourcesFolder displayName="rooms" resourceConstructor={Room} />
        <ul class="resources sprites">
            {#each rooms as room (room.uuid)}
                <li>
                    <ResourceTreeResource selfResource={room}></ResourceTreeResource>
                </li>
            {/each}
        </ul>
    </div>
</Card>

<style>
    .scroll-box {
        border: 1px solid transparent;
        box-sizing: border-box;
        flex-grow: 1;
    }
    
    .resources {
        margin-bottom: .5rem;
        /* margin-left: 10px; */
        /* height: 400px; */
        /* width: 220px; */
    }

    ul.resources li {
        /* margin: 4px; */
        margin-left: 10px;
        list-style-position: outside;
    }
</style>