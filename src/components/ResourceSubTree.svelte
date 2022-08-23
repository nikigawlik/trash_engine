
<script lang="ts">
import Folder from "src/modules/structs/folder";
import type Resource from "src/modules/structs/resource";


    export let resource : Resource;
    export let name : string;
</script>

<ul>
    {#if resource instanceof Folder}
        {#each resource.contents as childResource}
            <li>
                <svelte:self resource={childResource} name={childResource.name}></svelte:self>
            </li>   
            
        {/each}
    {:else}
            <ResourceSubTree
    {/if}
</ul>