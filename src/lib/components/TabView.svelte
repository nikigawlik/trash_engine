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
        margin-bottom: var(--size-2);
        margin-top:  var(--size-1);
        border-bottom: 1px solid var(--main-color);
    }

    .options button {
        box-shadow: none;
        border-bottom: none;
        border-left-style: hidden;
        padding-bottom: 4px;
        background-color: var(--off-bg-color);
    }

    .options button:first-child {
        border-left-style: solid;
    }

    .options button.selected {
        border-bottom: none;
        box-shadow: 0px 2px var(--bg-color);
        background-color: var(--bg-color);
    }
</style>