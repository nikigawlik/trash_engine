import htm from "../ext/htm.mjs";

console.log("deps.mjs loading")

/**
 * 
 * @param {string | any} tagName 
 * @param {any} attrs 
 * @param  {...any} children 
 * @returns HTMLElement
 */
function createElement(tagName, attrs = {}, ...children) {
    this[0] = 3; // magic number to disable caching
    if(typeof tagName != "string") {
        return tagName(attrs, ...children);
    }

    let elem = document.createElement(tagName);
    for(let key in attrs) {
        if(typeof attrs[key] == "function") {
            // handle event
            elem[key] = attrs[key];
        } else {
            elem.setAttribute(key, attrs[key])
        }
    }
    for (let child of children) {
        if (Array.isArray(child)) {
            elem.append(...child);
        }
        else {
            elem.append(child);
        }
    }
    return elem;
}

/**
 * 
 * @returns {HTMLElement}
 */
let html = htm.bind(createElement);
// let html = () => null;

export {
    html 
}