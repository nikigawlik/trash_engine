<script lang=ts>
    export let href = ''
    export let title = undefined

    import { createEventDispatcher, getContext } from "svelte";

    let changePage = getContext<{changePage: (string) => boolean}>("markdownManager").changePage;

    let clickLink = (event: MouseEvent) => {
        let success = changePage(href);
        if(success) event.preventDefault();
    }
</script>

<a {href} {title} on:click={clickLink}><slot></slot></a>