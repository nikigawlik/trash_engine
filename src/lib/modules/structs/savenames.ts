import Sprite from "./sprite";
import Room from "./room";
import Folder from "./folder";
import Instance from "./instance";
import Behaviour from "./behaviour";
import BehaviourLink from "./behaviourLink";
import BCustomSvelte from "../../components/behaviours/BCustom.svelte";
import BPlayerControllerSvelte from "../../components/behaviours/BPlayerController.svelte";

// export let nameConstructorMap: Map<string, {new (): Object}> = new Map();

// TODO this doesn't need to be 'any', I could try to figure our a way to make this work with typing
export let nameConstructorMap: Map<string, any> = new Map();

nameConstructorMap.set("Sprite", Sprite);
nameConstructorMap.set("Room", Room);
nameConstructorMap.set("Folder", Folder);
nameConstructorMap.set("Instance", Instance);
nameConstructorMap.set("Behaviour", Behaviour);
nameConstructorMap.set("BehaviourLink", BehaviourLink);
nameConstructorMap.set("BCustomSvelte", BCustomSvelte);
nameConstructorMap.set("BPlayerControllerSvelte", BPlayerControllerSvelte);

