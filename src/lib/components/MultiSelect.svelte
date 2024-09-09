<script lang="ts">

export let options = [] as string[];
export let value = "";
export let onSelect = (value: string) => {};

function selectOption(option: string) {
    value = option;
    onSelect(value);
}

</script>

<li>
    {#each options as opt}
        <ul>
            <button on:click={() => selectOption(opt)} class:selected={value == opt}>
			    <slot option={opt} >{opt}</slot>
            </button>
        </ul>
    {/each}
</li>


<style>
    li {
        display: flex;
        padding-top: var(--size-2);
        padding-bottom: var(--size-2);
        /* gap: var(--size-1) */
    }

    button {
        display: block;
        font-size: var(--size-4);
        padding: var(--size-1) var(--size-2);
        background-color: var(--off-bg-color);
        border: none;
        border-radius: 0;
    }

    .selected {
        border: 1px solid var(--main-color);
        background-color: var(--bg-color);
    }
</style>