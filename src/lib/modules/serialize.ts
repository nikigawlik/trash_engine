import { asStore, storeRegistered } from "./store_owner";
import { nameConstructorMap } from "./structs/savenames";

export let constructors: Map<string, { new(): Object; }> = new Map();
export let inverseConstructors: Map<{ new(): Object; }, string> = new Map();

let needsInit = true;

export function init() {
    needsInit = false;
    // constructor map -> just import
    constructors = nameConstructorMap();
    
    // set up the inverse map
    inverseConstructors.clear();
    for (let [key, value] of constructors) {
        inverseConstructors.set(value, key);
    }
}


// is used to create clean copy before storing in db
export async function serialize(obj: any | null, allowBlob = false) 
{
    if(needsInit) init();
    var copy: any;

    // function
    if (typeof obj === "function") {
        return {
            _func: inverseConstructors.get(obj)
        };
    }

    // the 3 simple types, and null or undefined
    if (!(obj instanceof Object)) return obj;

    // canvas
    if (obj instanceof HTMLCanvasElement) {
        if (allowBlob)
            return await new Promise(resolve => obj.toBlob(resolve, "image/png"));

        else
            return {
                _imageURL: obj.toDataURL("image/png")
            };
    }

    // array
    if (obj instanceof Array) {
        copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = await serialize(obj[i], allowBlob);
        }
        return copy;
    }

    if(obj instanceof Map) {
        let copy = {
            _type: "Map"
        }
        for(let [key, value] of obj.entries()) {
            copy[key] = await serialize(value);
        }
        return copy;
    }

    // object
    if (obj instanceof Object) { // should always be true at this point
        copy = {};

        if (inverseConstructors.has(obj.constructor)) {
            copy._type = inverseConstructors.get(obj.constructor);
        }
        else if (obj.constructor != Object) {
            throw makeUnrecognizedTypeError(obj.constructor.name);
        }

        for (var attr in obj) {
            if (obj.hasOwnProperty(attr) && attr[0] != "_")
                copy[attr] = await serialize(obj[attr], allowBlob);
        }

        return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
}

export async function deserialize(obj: any | null, additionalProperties: WeakMap<object, object>) 
{
    if(needsInit) init();

    // the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return await obj;

    // image -> canvas
    if (obj instanceof Blob) {
        if (obj.type == "image/png") {
            let img = new Image();
            let promise = new Promise(resolve => img.onload = resolve);
            img.src = URL.createObjectURL(obj);
            await promise;
            let canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            let ctx = canvas.getContext("2d");
            if (ctx) ctx.drawImage(img, 0, 0);

            return canvas;
        }
    }

    // array
    if (obj instanceof Array) {
        let copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = await deserialize(obj[i], additionalProperties);
        }
        return copy;
    }

    // object
    if (obj instanceof Object) {
        if (obj._func) {
            // reference to a known type/function
            if (!constructors.has(obj._func)) throw makeUnrecognizedTypeError(obj._func);

            return constructors.get(obj._func);
        } else if (obj._imageURL) {
            // from image data url
            let img = new Image();
            let promise = new Promise(resolve => img.onload = resolve);
            img.src = obj._imageURL;
            await promise;
            let canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            let ctx = canvas.getContext("2d");
            if (ctx) ctx.drawImage(img, 0, 0);

            return canvas;
        } else {
            if(obj._type == "Map") {
                let copy = new Map();
                for(let key in obj) {
                    if(key[0] != "_")
                        copy.set(key, await deserialize(obj[key], additionalProperties));
                }
                return copy;
            } 
            else if (obj._type) {
                if (!constructors.has(obj._type)) throw makeUnrecognizedTypeError(obj._type);

                let constructor = constructors.get(obj._type);
                // object of a known type/function
                let copy = new constructor() as any;

                for (var attr in obj) {
                    if (obj.hasOwnProperty(attr) && attr[0] != "_") {
                        // for defined types the property needs to already exist
                        if (copy.hasOwnProperty(attr)) {
                            const value = await deserialize(obj[attr], additionalProperties);
                            if(storeRegistered(copy[attr]))
                                asStore(copy[attr]).set(value)
                            else
                                copy[attr] = value;
                        } else {
                            // remember for data transform stuff
                            if (!additionalProperties.has(copy)) additionalProperties.set(copy, {});
                            additionalProperties.get(copy)[attr] = await deserialize(obj[attr], additionalProperties);
                        }
                    }
                }
                // possible way of implementing custom behaviour in the serialized objects:
                // if (typeof (constructor as any)._afterDeserialize === 'function') {
                //     (constructor as any)._afterDeserialize(copy);
                // }
                return copy;
            } else {
                // other/unknown object
                let copy = {};
                for (var attr in obj) {
                    if (obj.hasOwnProperty(attr) && attr[0] != "_")
                        copy[attr] = await deserialize(obj[attr], additionalProperties);
                }
                return copy;
            }
        }
    }

    console.log(obj)
    throw new Error("Unable to copy obj! Its type isn't supported.");
}

export function makeUnrecognizedTypeError(typeName: string) {
    let recogTypes = Array.from(constructors.keys());
    return new UnrecognizedTypeError(`Unknown type: ${typeName}. Recognized types: ${recogTypes.join(", ")}`);
}

export class UnrecognizedTypeError extends Error {
    constructor(message) {
        super(message);
        this.name = 'UnrecognizedTypeError';
    }
}

// export function deepClone(obj: any) {
//     return deserialize(serialize(obj));
// }


export function requestAsync<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
        request.onsuccess = (e): void => resolve(request.result);
        request.onerror = (e): void => reject(request.error);
    });
}