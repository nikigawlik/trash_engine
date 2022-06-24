import { Folder, ResourceManager, resourceManager, Room } from "./resource_manager.mjs";
import { SaveSystem } from "./save_system.mjs";
import * as sprite_editor from "./sprite_editor.mjs";
import { Sprite } from "./sprite_editor.mjs";
import * as ui from "./ui.mjs";


window.onload = async () => {
    // register all elements
    await ResourceManager.init();
    await SaveSystem.init();
    window.testResources();
    console.log(resourceManager);
    await ui.init();
    await sprite_editor.init();
}




window.testResources = () => {
    let r = resourceManager || new ResourceManager();
    // r.addSprite(new Sprite("sprite0"));
    // r.addSprite(new Sprite("sprite1"));
    // r.addSprite(new Sprite("sprite2"));
    // let f = new Folder(undefined, [new Sprite("sprite3"), new Sprite("sprite4")]);
    // r.addSprite(f);
    // f.add(new Folder(undefined, [new Sprite("fanta")]));

    // r.addRoom(new Room("test_room"));
    // r.addRoom(new Room("test_room1"));
    // r.addRoom(new Room("test_room2"));
    // r.addThing(new Thing("test_thing"));
    // r.addThing(new Thing("test_thing1"));
    // r.addThing(new Thing("test_thing2"));
    // r.addThing(new Thing("test_thing3"));

    return r;
}