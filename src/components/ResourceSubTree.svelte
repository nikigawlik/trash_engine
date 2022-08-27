
<script lang="ts">
import Folder from "./../modules/structs/folder";
import ResourceTreeResource from "./ResourceTreeResource.svelte";


    export let folder : Folder;
</script>

<ul>
    {#each folder.contents as childResource}
    <li>
        <ResourceTreeResource selfResource={childResource}></ResourceTreeResource>
        {#if childResource instanceof Folder}
            <svelte:self resource={childResource} name={childResource.name}></svelte:self>
        {/if}
    </li>   
    {/each}
</ul>