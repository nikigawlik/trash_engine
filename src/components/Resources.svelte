<script lang="ts">
import type { CardInstance } from "../modules/cardManager";

import type Folder from "../modules/structs/folder";

import ResourceManager, { resourceManager } from "./../modules/ResourceManager";
import Card from "./Card.svelte";
import ResourceSubTree from "./ResourceSubTree.svelte";
import ResourceTreeResource from "./ResourceTreeResource.svelte";

export let card: CardInstance;
$: card.name = "resources";
$: card.className = "resources";

// let root = resourceManager.get()?.root;
$: folders = ($resourceManager?.root.contents || []) as Folder[] 

</script>

<!-- {@debug folders} -->

<Card {card}>
    <div class="scroll-box">
        <ul class="resources">
            {#each folders as x}
            <ResourceTreeResource selfResource={x}></ResourceTreeResource>
            <li>
                <ResourceSubTree folder={x}></ResourceSubTree>
            </li>
            {/each}
        </ul>
    </div>
</Card>

<style>
    .scroll-box {
        border: none;
    }
</style>