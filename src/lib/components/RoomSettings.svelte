<script lang="ts">
    import { Writable } from "svelte/store";
    import Room from "../modules/structs/room";

    export let style = "";
    export let roomStore: Writable<Room>;
</script>

{#if roomStore && $roomStore}
<div class="container">
    <div class="room-config" {style}>
        <div>
            <label
                ><input
                    type="checkbox"
                    name="grid_enabled"
                    bind:checked={$roomStore.grid.enabled}
                /> grid
            </label>
            <label for="grid_width" hidden> width </label>
            <input
                name="grid_width"
                type="number"
                bind:value={$roomStore.grid.width}
            />
            x
            <label for="grid_height" hidden> height </label>
            <input
                name="grid_height"
                type="number"
                bind:value={$roomStore.grid.height}
            />
        </div>
        <span class="spacer" />
        <label for="snap_mode">snap</label>
        <label
            ><input
                type="radio"
                value="center"
                checked
                bind:group={$roomStore.grid.snap}
            /> center
        </label>
        <label
            ><input
                type="radio"
                value="corner"
                bind:group={$roomStore.grid.snap}
            /> corner
        </label>
        <!-- <span class="spacer" />
        <label for="background_color">background: </label><input name="background_color" type="color" bind:value={bgColor}/> -->
        <span class="spacer" />
        <label
            >background <input
                type="color"
                bind:value={$roomStore.backgroundColor}
            /></label
        >
        <label
            >width <input type="number" bind:value={$roomStore.width} /></label
        >
        <label
            >height <input
                type="number"
                bind:value={$roomStore.height}
            /></label
        >
    </div>
    
</div>
{/if}

<style>
    .container {
        position: relative;
    }
    .room-config {
        position: absolute;
        left: var(--size-2);
        top: var(--size-2);
        padding: var(--size-2);
        background-color: var(--bg-color);
        width: fit-content;
        height: fit-content;
        overflow-x: hidden;
    }
    .room-config {
        margin-bottom: 7px;
        flex-grow: 1;
        min-height: var(--size-4);
        display: flex;
        flex-direction: column;
        gap: 4px;
        align-items: baseline;
    }
    .room-config input[type="number"] {
        width: 3.5em;
    }

    label {
        vertical-align: middle;
        /* margin: auto 0; */
    }

    label > * {
        vertical-align: middle;
    }

    /* Chrome, Safari, Edge, Opera */
    input::-webkit-outer-spin-button,
    input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }

    /* Firefox */
    input[type="number"] {
        -moz-appearance: textfield;
        appearance: textfield;
    }
</style>
