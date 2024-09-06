import BCustomSvelte from "../../components/behaviours/BCustom.svelte";
import BPlayerControllerSvelte from "../../components/behaviours/BPlayerController.svelte";
import GameData from "../game/game_data";
import Behaviour from "./behaviour";
import BehaviourLink from "./behaviourLink";
import Instance from "./instance";
import Room from "./room";
import SoundEffect from "./soundEffect";
import Sprite from "./sprite";


// As part of deserialization in database.ts, all of these constructors are called wiht no arguments, like `new Instance()`
// So why is the type "any" instead of "{new (): Object}"?
// Because for a lot of these that is *the only time* that happens,
// but in all other scenarios I want some parameters to be mandatory -> like `new Instance(player, 123, 231)`
// so it's "any" so that TypeScript doesn't complain

// export let nameConstructorMap: Map<string, any> = new Map();
export function nameConstructorMap() {
    let mp: Map<string, any> = new Map();

    mp.set("Sprite", Sprite);
    mp.set("Room", Room);
    mp.set("Instance", Instance);
    mp.set("Behaviour", Behaviour);
    mp.set("SoundEffect", SoundEffect);
    mp.set("BehaviourLink", BehaviourLink);
    mp.set("BCustomSvelte", BCustomSvelte);
    mp.set("BPlayerControllerSvelte", BPlayerControllerSvelte);
    mp.set("GameData", GameData)

    return mp;
}
