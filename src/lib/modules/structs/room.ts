import type ResourceManager from "../game/ResourceManager";
import type Instance from "./instance";
import Resource from "./resource";

export default class Room extends Resource {
    width: number;
    height: number;
    instances: Instance[];
    backgroundColor: string;
    constructor(name = "room", resourceManager: ResourceManager) {
        super(name, resourceManager);
        this.width = ~~(540 * 12/9);
        this.height = 540;
        this.instances = [];
        this.backgroundColor = "#222222";
        // this.gridEnabled = true;
        // this.gridWidth = 60;
        // this.gridHeight = 60;
        // this.gridSnap = "center"; // "center" or "corner"
        // this._canvas = null;
    }
    
    getIconElement() {
        return `🌳`;
    }

    filterInstances() {
        this.instances = this.instances.filter(inst => inst.isValid());
    }

}

