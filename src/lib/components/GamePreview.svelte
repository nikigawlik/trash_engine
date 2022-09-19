
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

</script>

<Card {card}>
    <p><a href="/game" target="_blank">separate window</a></p>
    <p><button on:click={reload}>reload ↺</button></p>
    <iframe title="gametest" src="game" bind:this={iframe} />
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