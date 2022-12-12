<script lang="ts">
import type { CardInstance } from "../modules/cardManager";
import Card from "./Card.svelte";

    export let card: CardInstance;
    $: card.name = "script";

    let scriptText: string;

    function runScript() {
        console.log("run script!");

        // change the stack trace to custom format (only Chrome / V8)
        Error.prepareStackTrace = function(error, structuredStackTrace) {
            let cs = structuredStackTrace[0];
            return {
                lineNumber: cs.getLineNumber(),
                columnNumber: cs.getColumnNumber(),
            };
        }

        try {
            let f = new Function(scriptText);
            f();
        } catch(e) {
            if(e instanceof Error) {

                // @ts-ignore
                let line = e.lineNumber || e.stack.lineNumber;
                // @ts-ignore
                let column = e.columnNumber || e.stack.columnNumber;

                console.log(`line: ${line} column: ${column} error: ${e.message}`);
                
                // TODO re-add errors

                // let errorCard = html`
                // <${ErrorWindow} 
                // line=${line-2} 
                // column=${column} 
                // errorName=${e.name} 
                // errorMessage=${e.message}/>
                // `;
                // document.querySelector("main").append(errorCard);
            }
        }
    }

</script>

<Card {card}>
    <p><button title="run" class="play">▶</button></p>
    <textarea cols="40" rows="10" bind:value={scriptText}></textarea>
</Card>

<style>
    textarea {
        flex-grow: 1;
        white-space: pre;
        overflow-wrap: normal;
        overflow: scroll;
    }
</style>

