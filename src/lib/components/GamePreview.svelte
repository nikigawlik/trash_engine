
<script lang="ts">

import type { CardInstance } from "../modules/cardManager";
import { resourceManager } from "../modules/game/ResourceManager";
import Card from "./Card.svelte";

    export let card: CardInstance;
    $: card.name = "game preview";

    let iframe: HTMLIFrameElement|null;

    async function reload() {
        if(!iframe) return;
        let resourceData = await resourceManager.get().getSerializedData();
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
    
</script>

<!-- Disabling pointer events is necessary for resizing cards to work -->
<svelte:window 
    on:mousedown={disableIFramePointerEvents}
    on:mouseup={enableIFramePointerEvents}
    on:mouseleave={enableIFramePointerEvents}
></svelte:window>

<Card {card}>
    <p><a href={`${location.href}?game`} target="_blank">separate window</a></p>
    <p><button on:click={reload}>reload ↺</button></p>
    <iframe title="gametest" src={`${location.href}?game`} bind:this={iframe} />
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