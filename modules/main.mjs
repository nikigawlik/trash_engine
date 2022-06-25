import * as database from "./database.mjs";
import { ResourceManager, resourceManager } from "./resource_manager.mjs";
import * as sprite_editor from "./sprite_editor.mjs";
import * as ui from "./ui.mjs";


window.onload = async () => {
    // initialize different modules
    await database.init();
    await ResourceManager.init();
    window.testResources();
    await ui.init();
    await sprite_editor.init();
    // await SaveSystem.init();
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