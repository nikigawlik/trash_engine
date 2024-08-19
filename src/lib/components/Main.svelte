<script lang="ts">
import { setContext } from "svelte";
import { cards, openCard } from "./../modules/cardManager";
import Resources from "./Resources.svelte";
    import { resourceManager } from "../modules/game/ResourceManager";
    import RoomEditor from "./RoomEditor.svelte";
    import Room from "../modules/structs/room";

    openCard(Resources);
    let rooms = $resourceManager.getAllOfResourceType(Room);
    if(rooms.length > 0)
        openCard(RoomEditor, rooms[0].uuid)

    // let loadPromise = $resourceManager.loadDefaultProject();
    let loadPromise = $resourceManager.load();

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