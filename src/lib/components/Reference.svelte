<script lang="ts">
    import type { CardInstance } from "../modules/cardManager";
    import Card from "./Card.svelte";
    import SvelteMarkdown from 'svelte-markdown'
    import { setContext } from "svelte";
    import MarkdownLink from "./MarkdownLink.svelte";
    
    import reference from '../../assets/markdown/reference.md?raw';
    import collisions from '../../assets/markdown/collisions.md?raw';

    export let card: CardInstance;
    $: card.name = "reference";

    const markdownFiles = {
        reference,
        collisions,
    }

    let source = reference;

    setContext("markdownManager", {
        changePage: (route: string) => {
            const src = markdownFiles[route];
            if(src != undefined) source = src;
        }
    })
</script>
    
<Card card={card} autoFocus={false}>
    <div class=scroll>
        <section class="document">
            <SvelteMarkdown {source} renderers={{link: MarkdownLink}}></SvelteMarkdown>
        </section>
    </div>
</Card>

<style>
    .scroll {
        overflow-x: scroll;
        flex-grow: 1;
    }
    section {
        margin: 0 3em;
    }
</style>