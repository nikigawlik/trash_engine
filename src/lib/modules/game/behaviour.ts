import type { SvelteComponent } from "svelte"

export default class Behaviour {
    uuid: string
    name: string
    props: string[]
    code: string
    iconID: number
    data: any
    svelteComponent: typeof SvelteComponent
    // drawCode: string
    constructor(name = "UnnamedBehaviour") {
        this.uuid = crypto.randomUUID();
        this.name = name;
        this.props = [];
        this.code = "";
        this.iconID = 0;
        this.data = {};
    }
}