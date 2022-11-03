<script lang="ts">
    import { createEventDispatcher } from "svelte";

    export let options: {name:string, id:number}[] = [];
    export let currentSelected = null;
</script>

<ul class=saveSelect>
    {#each options as option}
        {#if option}
            <li>
                <button 
                    class="plain" 
                    on:click={() => currentSelected = option}
                    data-selected={currentSelected?.id == option.id}
                >
                    {#if option.id < 0}
                    <span>{option.name}</span>
                    {:else}
                    <span>{option.id} - {option.name}</span>
                    {/if}
                </button>
            </li>
        {/if}
    {/each}
</ul>

<style>
    
    ul {
        max-height: 240px;
        overflow-y: scroll;
        border: 1px solid var(--main-color);
    }

    button {
        display: table-cell;
        width: 100%;
        text-align: left;
        overflow: hidden;
        white-space: nowrap;
    }

    button[data-selected="true"] {
        background-color: var(--main-color);
        color: var(--bg-color);
    }

</style>