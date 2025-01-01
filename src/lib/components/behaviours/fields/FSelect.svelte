<script lang="ts">
    
    export let id: string;
    export let label: string = "";
    export let value: string;
    export let options: string[];
    export let includeNone = false;
    export let labels = [] as string[];

</script>

<label for="id">
    {label}<slot />
</label>
<select {id} bind:value={value}>
    {#if includeNone}
    <option value={""}>(none)</option>
    {/if}
    {#each options as option, i}
        <option value={option}>{labels[i] || option}</option>
    {/each}
</select>
