<script lang="ts">
import type { CardInstance } from "../../modules/cardManager";
import Behaviour from "../../modules/structs/behaviour";


import { gameData } from "../../modules/game/game_data";
import { compareBy } from "../../modules/game/utils";
import Room from "../../modules/structs/room";
import SoundEffect from "../../modules/structs/soundEffect";
import Sprite from "../../modules/structs/sprite";
import Card from "../Card.svelte";
import ResourcesFolder from "../ResourcesFolder.svelte";
import ResourceTreeResource from "../ResourceTreeResource.svelte";

export let card: CardInstance;
$: card.name = "resources";
// $: card.className = "resources";
$: card.position.width = 240;


$: s_sprites = $gameData.getResourceTypeStore(Sprite)
$: sprites = $s_sprites.sort(compareBy(x => x.name));

$: s_rooms = $gameData.getResourceTypeStore(Room)
$: rooms = $s_rooms.sort(compareBy(x => x.name));

$: s_behaviours = $gameData.getResourceTypeStore(Behaviour)
$: behaviours = $s_behaviours.sort(compareBy(x => x.name));

$: s_soundEffects = $gameData.getResourceTypeStore(SoundEffect)
$: soundEffects = $s_soundEffects.sort(compareBy(x => x.name));

</script>

<!-- {@debug folders} -->

<Card {card} hasCornerButtons={false}>
    <div class="scroll-box">
        <ResourcesFolder displayName="sprites" resourceConstructor={Sprite}>
            <ul class="resources sprites">
                {#each sprites as sprite (sprite.uuid)}
                    <li>
                        <ResourceTreeResource resource={sprite}></ResourceTreeResource>
                    </li>
                {/each}
            </ul>
        </ResourcesFolder>
        <ResourcesFolder displayName="rooms" resourceConstructor={Room}>
            <ul class="resources sprites">
                {#each rooms as room (room.uuid)}
                    <li>
                        <ResourceTreeResource resource={room}></ResourceTreeResource>
                    </li>
                {/each}
            </ul>
        </ResourcesFolder>
        <ResourcesFolder displayName="sounds" resourceConstructor={SoundEffect}>
            <ul class="resources sounds">
                {#each soundEffects as soundEffect (soundEffect.uuid)}
                    <li>
                        <ResourceTreeResource resource={soundEffect}></ResourceTreeResource>
                    </li>
                {/each}
            </ul>
        </ResourcesFolder>
        <ResourcesFolder displayName="scripts" resourceConstructor={Behaviour}>
            <ul class="resources behaviours">
                {#each behaviours as behaviour (behaviour.uuid)}
                    <li>
                        <ResourceTreeResource resource={behaviour}></ResourceTreeResource>
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