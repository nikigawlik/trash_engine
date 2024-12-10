<script lang="ts">

export let options = [] as string[];
export let value = "";
export let onSelect = (value: string) => {};
export let style: string = "";

function selectOption(option: string) {
    onSelect(option);
    value = option;
}

</script>

<ul style={style}>
    {#each options as opt}
        <li>
            <button on:click={() => selectOption(opt)} class:selected={value == opt}>
			    <slot option={opt} >{opt}</slot>
            </button>
        </li>
    {/each}
</ul>


<style>
    ul {
        display: flex;
        padding-top: var(--size-1);
        padding-bottom: var(--size-1);
        /* overflow-x: scroll; */
        gap: var(--size-1);
    }

    button {
        display: block;
        font-size: var(--size-4);
        padding: var(--size-1) var(--size-1);
        background-color: var(--off-bg-color);
        border: 1px solid transparent;
        border-radius: 0;
        height: fit-content;
    }

    button:hover {
        background-color: var(--off-main-color);
        color: var(--bg-color);
    }

    .selected {
        border: 1px solid var(--main-color);
        background-color: var(--bg-color);
    }

    ul {
        
        height: fit-content;
        align-self: baseline;
    }
</style>