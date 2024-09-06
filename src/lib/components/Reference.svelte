<script lang="ts">
    import { setContext } from "svelte";
    import SvelteMarkdown from 'svelte-markdown';
    import type { CardInstance } from "../modules/cardManager";
    import Card from "./Card.svelte";
    import MarkdownLink from "./MarkdownLink.svelte";
    
    import collisions from '../../assets/markdown/collisions.md?raw';
    import disclaimer from '../../assets/markdown/disclaimer.md?raw';
    import quickref from '../../assets/markdown/quickref.md?raw';
    import reference from '../../assets/markdown/reference.md?raw';

    export let card: CardInstance;
    $: card.name = "reference";
    $: card.position.width = 600;

    const markdownFiles = {
        reference,
        collisions,
        quickref,
        disclaimer,
    }

    let pageName = (card.data?.pageName as string|undefined) || null;

    let source = pageName && markdownFiles[pageName] ?
        markdownFiles[pageName]
    :
        quickref;

    setContext("markdownManager", {
        changePage: (route: string) => {
            const src = markdownFiles[route];
            if(src != undefined) {
                source = src;
                return true;
            } else {
                return false;
            }
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