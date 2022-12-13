<script lang="ts">
import type { CardInstance } from "../modules/cardManager";
    import Behaviour from "../modules/structs/behaviour";


import { resourceManager } from "../modules/game/ResourceManager";
import Room from "../modules/structs/room";
import Sprite from "../modules/structs/sprite";
import Card from "./Card.svelte";
import ResourcesFolder from "./ResourcesFolder.svelte";
import ResourceTreeResource from "./ResourceTreeResource.svelte";

export let card: CardInstance;
$: card.name = "resources";
$: card.className = "resources";
$: card.position.width = 240;

// let root = resourceManager.get()?.root;
$: sprites = $resourceManager.getSprites();
$: rooms = $resourceManager.getRooms();
$: behaviours = $resourceManager.getBehaviours();

</script>

<!-- {@debug folders} -->

<Card {card}>
    <div class="scroll-box">
        <ResourcesFolder displayName="sprites" resourceConstructor={Sprite}>
            <ul class="resources sprites">
                {#each sprites as sprite (sprite.uuid)}
                    <li>
                        <ResourceTreeResource selfResource={sprite}></ResourceTreeResource>
                    </li>
                {/each}
            </ul>
        </ResourcesFolder>
        <ResourcesFolder displayName="rooms" resourceConstructor={Room}>
            <ul class="resources sprites">
                {#each rooms as room (room.uuid)}
                    <li>
                        <ResourceTreeResource selfResource={room}></ResourceTreeResource>
                    </li>
                {/each}
            </ul>
        </ResourcesFolder>
        <ResourcesFolder displayName="scripts" resourceConstructor={Behaviour}>
            <ul class="resources behaviours">
                {#each behaviours as behaviour (behaviour.uuid)}
                    <li>
                        <ResourceTreeResource selfResource={behaviour}></ResourceTreeResource>
                    </li>
                {/each}
            </ul>
        </ResourcesFolder>
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