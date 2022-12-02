
<script lang="ts">

import type { CardInstance } from "../modules/cardManager";
import { resourceManager } from "../modules/game/ResourceManager";
import { adjustedCanvasSize } from "../modules/game/utils";
import type Room from "../modules/structs/room";
import Card from "./Card.svelte";

    export let card: CardInstance;
    $: card.name = "game preview";

    let iframe: HTMLIFrameElement|null;
    

    async function reload() {
        if(!iframe) return;
        let resourceData = await $resourceManager.getSerializedData();
        const messageData = {
            type: "dataUpdate",
            resourceData,
        };
        iframe.contentWindow?.postMessage(messageData);
        // iframe.contentWindow?.postMessage({
        //     type: "reload",
        // });
    }

    function disableIFramePointerEvents() {
        iframe.style.pointerEvents = "none";
    }
    
    function enableIFramePointerEvents() {
        iframe.style.removeProperty("pointer-events");
    }

    let rooms = resourceManager?.get()?.getRooms()
    let room: Room|null = rooms.length > 0? rooms[0] : null;

    let iframeDisplayWidth = adjustedCanvasSize(room?.width);
    let iframeDisplayHeight = adjustedCanvasSize(room?.height);

    function onMessage(msg: any) {
        if(msg.data.type == "canvasSizeUpdate") {
            iframeDisplayWidth = msg.data.displayWidth;
            iframeDisplayHeight = msg.data.displayHeight;
            console.log("game size update")
        }
    }

    function getIFrameURL() {
        let url = new URL(location.href);
        url.searchParams.delete("editor");
        url.searchParams.set("game", "");
        return url.href;
    }
    
</script>

<!-- Disabling pointer events is necessary for resizing cards to work -->
<svelte:window 
    on:mousedown={disableIFramePointerEvents}
    on:mouseup={enableIFramePointerEvents}
    on:mouseleave={enableIFramePointerEvents}
    on:message={onMessage}
></svelte:window>

<Card {card}>
    <p><a href={`${location.href}?game`} target="_blank">separate window</a></p>
    <p><button on:click={reload}>reload ↺</button></p>
    <iframe 
        title="gametest" 
        src={getIFrameURL()} 
        bind:this={iframe} 
        style:width={iframeDisplayWidth}px
        style:height={iframeDisplayHeight}px
    />
</Card>

<style>
    iframe {
        width: 100%;
        height: 100%;
    }

    a {
        font-size: small;
    }
</style>