import type { SvelteComponent } from "svelte"
import BCustomSvelte from "../../components/behaviours/BCustom.svelte"
import Resource from "./resource"

export default class Behaviour extends Resource {
    props: string[]
    code: string
    iconID: number
    data: any
    svelteComponent: typeof SvelteComponent
    // drawCode: string
    constructor(name = "UnnamedBehaviour") {
        super(name)
        this.props = [];
        this.code = "";
        this.iconID = 0;
        this.data = {};
        this.svelteComponent = BCustomSvelte;
    }
}