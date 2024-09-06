import { get } from "svelte/store";
import { gameData } from "../game/game_data";
import Behaviour from "./behaviour";


export default class BehaviourLink implements Behaviour {
    linkedBehaviourUUID: string

    constructor(linkedBehaviourUUID: string) {
        this.linkedBehaviourUUID = linkedBehaviourUUID;
    }

    get behaviour() { return get(gameData).getResource(this.linkedBehaviourUUID, Behaviour) } 

    get props() { return this.behaviour.props; }
    get code() { return this.behaviour.code; }
    get iconID() { return 81; }
    get data() { return this.behaviour.data; }
    get svelteComponent() { return this.behaviour.svelteComponent; }
    get name() { return this.behaviour.name; }
    get type() { return this.behaviour.type; }
    get uuid() { return this.behaviour.uuid; }
    
    getIconElement(): string {
        return `❔`;
    }
}