let steppers = [];
let objects = {};
let instances = [];

export async function loadObject(name) {
    let path = "game/objects/" + name + ".js";
    console.log("loading " + path);

    let response = await fetch(path);
    if(!response.ok) {
        throw Error(`http error: ${response.status} ${response.statusText}`);
    }
    let ftext = await response.text();

    let text = `
        let storeVars = function(target) {
            return new Proxy(target, {
                has(target, prop) { return true; },
                get(target, prop) { return (prop in target ? target : window)[prop]; }
            });
        }
    
        obj = obj || {};
        with(storeVars(obj)) {
            ${ftext}
        }
        // console.log(obj);
        return obj;
    `

    let func = new Function("obj", text);
    objects[name] = func;

    for(let i = 0; i < instances.length; i++) {
        let inst = instances[i];
        if(inst.name == name) {
            // update obj
            instances[i] = func(inst);
        }
    }
}

function callEvent(instance, eventName) {
    if(instance[eventName]) instance[eventName]();
}

export function createObject(name) {
    let obj = objects[name]();
    // obj["_create"] = obj["_create"] || (() => {});
    obj.name = name;
    callEvent(obj, "_create");
    instances.push(obj);
    return obj;
}

export function updateObject(name, obj) {
    return objects[name](obj);
}


export function step() {
    window.clearBackground();
    for(let instance of instances) {
        callEvent(instance, "_step");
    }
    window.requestAnimationFrame(step);
}


// debug
window.loadObject = loadObject;
window.createObject = createObject;
window.updateObject = updateObject;
window.objects = objects;
window.steppers = steppers;

window.debugLog = (str) => console.log(`> ${str}`);
