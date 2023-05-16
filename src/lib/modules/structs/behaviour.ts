import type { SvelteComponent } from "svelte"
import BCustomSvelte from "../../components/behaviours/BCustom.svelte"
import Resource from "./resource"

// TODO do this in BCustom (or change the way behaviours work generally)
const defaultCode = `
// for available methods and variables check the help
// initalisation code here
// x = 100;

onUpdate( () => {
  // update code here (runs 60 times per second)
  // x += 10;
});
`

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
        this.code = defaultCode;
        this.iconID = 0;
        this.data = {};
        this.svelteComponent = BCustomSvelte;
    }
}