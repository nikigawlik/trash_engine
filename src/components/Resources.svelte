<script lang="ts">
import ResourceManager from "src/modules/ResourceManager";
import ResourceSubTree from "./ResourceSubTree.svelte";

let root = ResourceManager.resourceManager.root;

</script>



<div class="scroll-box">
    <ul class=resources>
        {#each root.contents as x}
            <li>
                <ResourceSubTree resource={x} name={x.name}></ResourceSubTree>
            </li>
        {/each}
    </ul>
</div>