import type { Key } from "./Key.enum";

let keysDown: Set<string>;
let keysPressed: Set<string>;
let keysReleased: Set<string>;

export function keyDown(key: Key|string) {
    return keysDown.has(key);
}

export function keyPressed(key: Key|string) {
    return keysPressed.has(key);
}

export function keyReleased(key: Key|string) {
    return keysReleased.has(key);
}


export function init() {
    keysDown = new Set();
    window.addEventListener("keydown", event => {
        keysDown.add(event.key);
        keysPressed.add(event.key);
    });
    window.addEventListener("keyup", event => {
        keysDown.delete(event.key);
        keysReleased.add(event.key);
    });
}

export function endOfTick() {
    keysPressed.clear();
    keysReleased.clear();
}