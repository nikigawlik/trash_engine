<script context="module" lang="ts">
import { writable,type Writable } from "svelte/store";

    export interface ContextMenuOption {
        text: string
        callback: () => Promise<void>
    }

    export interface ContextMenuData {
        title: string
        options: ContextMenuOption[],
        x: number
        y: number
    }

    const { subscribe, set, update } = writable(null) as Writable<ContextMenuData|null>;

    export let currentContextMenu = {
        subscribe,
        set,
        update,
        addOption(text: string, callback: () => Promise<void>) {
            update(value => {
                // value ||= {title: "", options: [], x:0, y: 0};
                value?.options.push({text, callback})
                return value;
            })
        },
        reset() { set(null) },
    }

</script>

<script lang="ts">
    import { onMount } from "svelte";

    export let data: ContextMenuData|null;

    let buttonElements: HTMLElement[];
    $: buttonElements = []

    onMount(() => {
        buttonElements[0]?.focus();
    });

    function loseFocus() {
        data = null;
    }

    function onFocusOut(evt: FocusEvent) {
        // lose focus if user tabs to another element
        if(!evt.relatedTarget || !(evt.relatedTarget instanceof HTMLElement) || !buttonElements.includes(evt.relatedTarget)) 
            loseFocus();
    }

    function onClickOption(evt: MouseEvent, opt: ContextMenuOption) {
        opt.callback(); 
        evt.stopPropagation(); 
        data = null;
    }

</script>

{#if data}
    <span class=dummy>
        <ul 
        class="context-menu" 
        style:left={data.x - 5}px 
        style:top={data.y - 5}px
        on:mouseleave={loseFocus}
        on:focusout={onFocusOut}
        >
            {#each data.options as opt, i}
                <li><button 
                    bind:this={buttonElements[i]} 
                    on:click={ evt => onClickOption(evt, opt) }
                >
                    {opt.text}
                </button></li>
            {/each}
        </ul>
    </span>
{/if}

<style>
    .dummy {
        position: relative;
        width: 0;
        height: 0;
    }
    ul {
        position: absolute;
    }
</style>
