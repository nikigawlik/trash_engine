import Sprite from "./sprite";
import Room from "./room";
import Folder from "./folder";
import Instance from "./instance";

export let nameConstructorMap: Map<string, {new (): Object}> = new Map();

nameConstructorMap.set("Sprite", Sprite);
nameConstructorMap.set("Room", Room);
nameConstructorMap.set("Folder", Folder);
nameConstructorMap.set("Instance", Instance);

