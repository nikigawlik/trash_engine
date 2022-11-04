<script lang=ts>
    export let href = ''
    export let title = undefined

    import { createEventDispatcher, getContext } from "svelte";

    let changePage = getContext<{changePage: (string) => void}>("markdownManager").changePage;
</script>

<a {href} {title} on:click|preventDefault={() => changePage(href)}><slot></slot></a>