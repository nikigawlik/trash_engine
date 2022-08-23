<script lang="ts">
import type Folder from "src/modules/structs/folder";

import ResourceManager from "./../modules/ResourceManager";
import ResourceSubTree from "./ResourceSubTree.svelte";

let root = ResourceManager.resourceManager.root;
$: folders = (root.contents as Folder[])

</script>



<div class="scroll-box">
    <ul class=resources>
        {#each folders as x}
            <li>
                <ResourceSubTree folder={x}></ResourceSubTree>
            </li>
        {/each}
    </ul>
</div>