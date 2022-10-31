
<script lang="ts">
import Folder from "./../modules/structs/folder";
import ResourceTreeResource from "./ResourceTreeResource.svelte";

    export let folder : Folder;
</script>

<ul>
    {#each folder.contents as childResource (childResource.uuid)}
    <li>
        <ResourceTreeResource selfResource={childResource}></ResourceTreeResource>
        {#if childResource instanceof Folder}
            <svelte:self folder={childResource}></svelte:self>
        {/if}
    </li>   
    {/each}
</ul>