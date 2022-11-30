import type ResourceManager from "../game/ResourceManager";
import type Instance from "./instance";
import Resource from "./resource";

export default class Room extends Resource {
    width: number;
    height: number;
    instances: Instance[];
    backgroundColor: string;
    grid: {
        width: number, 
        height: number, 
        snap: "center" | "corner", 
        enabled: boolean
    }
    constructor(name = "room") {
        super(name);
        this.width = ~~(540 * 12/9);
        this.height = 540;
        this.instances = [];
        this.backgroundColor = "#222222";
        this.grid = {
            enabled: true,
            snap: "center",
            width: 60,
            height: 60,
        }
        // this._canvas = null;
    }
    
    getIconElement() {
        return `🌳`;
    }

    filterInstances() {
        this.instances = this.instances.filter(inst => inst.isValid());
    }
}

