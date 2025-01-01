<script lang="ts">
    export let value: number;
    export let min: number = undefined;
    export let max: number = undefined;
    export let label: string = "";
    export let id: string;
</script>

<label for={id}>
    {label}<slot />
</label>
<input {id} type="number" bind:value={value} {min} {max}/>
