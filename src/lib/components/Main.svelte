<script lang="ts">
import { setContext } from "svelte";
import { gameData } from "../modules/game/game_data";
import Room from "../modules/structs/room";
import { cards, openCard } from "./../modules/cardManager";
import { getDisplayName } from "./../modules/names";
import Resources from "./Cards/Resources.svelte";
import RoomEditor from "./Cards/RoomEditor.svelte";

    openCard(Resources);
    let rooms = $gameData.getAllOfResourceType(Room);
    if(rooms.length > 0)
        openCard(RoomEditor, rooms[0].uuid)

    // TODO load default project here?
    let loadPromise = null;

    $: sortedCards = $cards.sort((a, b) => (a.position.x - b.position.x));

    let boundsElmt = null;

    setContext("getCardsBounds", () => boundsElmt);
</script>

<ul class="navmap">
    {#each sortedCards as c (c.uuid)}
        <li>
            <button on:click={() => cards.focus(c.uuid)}>
                {getDisplayName(c.componentType)}
            </button>
        </li>
    {/each}
</ul>

<main>
    {#await loadPromise}
        ...loading
    {:then _} 
    
    <div class=cards bind:this={boundsElmt}>
        {#each sortedCards as card (card.uuid)}
        <svelte:component this={card.componentType} card={card} />
        {/each}
    </div>
    {/await}
</main>

<style>
    .navmap {
        display: flex;
        flex-direction: row;
        gap: var(--size-2);
        padding: var(--size-2);
    }

    .cards {
        width: max-content;

        height: 100%;
        justify-content: left;

        display: flex;
        align-items: top;
        gap: 4px;
        
    }
    main {
        /* width: 100vw; */
        /* max-height: 40vh; */
        flex-grow: 1;
        flex-shrink: 1;
        flex-basis: 0;
        position: relative;

        
        overflow-y: hidden;
        overflow-x: scroll;

        padding: 0;
    }
</style>