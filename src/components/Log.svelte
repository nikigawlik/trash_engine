<script lang="ts">
import type { CardInstance } from "../modules/cardManager";
import Card from "./Card.svelte";


    export let card: CardInstance;
    $: card.name = "log";

    // TODO implement

    // let loggers = [];
    // if(typeof window !== 'undefined') {
    //     // @ts-ignore
    //     window.log = (obj) => {
    //         loggers = loggers.filter(x => x && x.append);
    //         for(let logger of loggers) {
    //             logger.append(obj);
    //             logger.append(document.createElement("br"));
    //         }
    //     }

    //     // @ts-ignore
    //     window.testCreateScript = () => {
    //         for(let e of document.querySelectorAll("main")) {
    //             let test2 = html`
    //             <${ScriptWindow}><//>
    //             `
    //             e.append(test2);
    //         }
    //     }
    // }
</script>

<Card card={card}>
    <p class="log">
    </p>
</Card>