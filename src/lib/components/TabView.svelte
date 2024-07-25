<script lang="ts">
    export let tabs: string[] = [];
    export let selected = "";
</script>

<div class="options">
    {#each tabs as tab}
        <button on:click={() => selected = tab } class:selected={selected == tab}>{tab}</button>
    {/each}
</div>

<style>
    .options {
        margin-bottom: 8px;
        border-bottom: 1px solid var(--main-color);
    }

    .options button {
        box-shadow: none;
        border-bottom: none;
        border-left-style: hidden;
        padding-bottom: 4px;
    }

    .options button:first-child {
        border-left-style: solid;
    }

    .options button.selected {
        border-bottom: none;
        box-shadow: 0px 2px var(--bg-color);
    }
</style>