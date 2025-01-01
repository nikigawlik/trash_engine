
let nameDict = new WeakMap<object, string>();

// nameDict.set(,"")

export function setDisplayName(thing: any, name: string) {
    if(!nameDict) nameDict = new WeakMap<object, string>();
    nameDict.set(thing, name);
}

export function getDisplayName(thing: any, caps?: "lower"|"upper") {
    if(nameDict.has(thing)) {
        const n = nameDict.get(thing);
        if(caps == "lower") 
            return n.toLowerCase();
        else if (caps == "upper")
            return n.toUpperCase();
        else
            return n;
    }
    else
        return `<name-missing ${thing?.name? thing.name : thing?.toString().substring(0, 10)}>`;
}