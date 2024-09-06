<script lang="ts">
import { setContext } from "svelte";
import { gameData } from "../modules/game/game_data";
import Room from "../modules/structs/room";
import { cards, openCard } from "./../modules/cardManager";
import Resources from "./Resources.svelte";
import RoomEditor from "./RoomEditor.svelte";

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