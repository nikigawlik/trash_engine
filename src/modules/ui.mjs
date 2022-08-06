import { rectIntersect, rectInside } from "./utils.mjs";

console.log("ui.mjs loading")

let maxZ = 0;

/**
 * @param {HTMLElement} cardElement 
 */
export function bringToFront(cardElement) {
    // this code for non-flexbox maximized stuff
    // if(window.getComputedStyle(cardElement).position != "absolute") {
    //     if(cardElement.parentNode) 
    //         cardElement.parentNode.insertBefore(cardElement, cardElement.parentNode.firstElementChild);
    // }
    cardElement.style.zIndex = ++maxZ;
}

export function setupDraggable(draggedElement, boundsElement, handleQuery, snap = 16) {
    if(!window) return;
    draggedElement.style.left = `0px`;
    draggedElement.style.top = `0px`;
    bringToFront(draggedElement);
    draggedElement.onmousedown = function(event) {
        if(window.getComputedStyle(draggedElement).position != "absolute") {
            return;
        }
        bringToFront(draggedElement);
        
        if(!event.target.matches(handleQuery)) {
            return;
        }

        draggedElement.dataset.isDragged = true;

        // move to front
        draggedElement.parentElement.append(draggedElement);

        let rect = draggedElement.getBoundingClientRect();
        let offsetX = rect.left - event.clientX;
        let offsetY = rect.top - event.clientY;

        let snappy = (v, s) => Math.round(v / s) * s;

        let moveElement = (x, y, snap = .01) => {
            // move element to cursor position (respecting offset)
            let areaBounds = boundsElement.getBoundingClientRect();
            // let left = snappy((x) + (offsetX) - areaBounds.left, snap);
            // let top = snappy((y) + (offsetY) - areaBounds.top, snap);

            let left = ((x) + (offsetX));
            let top = ((y) + (offsetY));
            
            // respect boundaries
            let elementBounds = draggedElement.getBoundingClientRect();
            // draggedElement.style.left = Math.max(Math.min(left, areaBounds.width - elementBounds.width), 0) + areaBounds.left + "px";
            // draggedElement.style.top = Math.max(Math.min(top, areaBounds.height - elementBounds.height), 0) + areaBounds.top + "px";
            // draggedElement.style.left = left + areaBounds.left + "px";
            // draggedElement.style.top = top + areaBounds.top + "px";
            draggedElement.style.left = snappy(left - areaBounds.left, 1) + "px";
            draggedElement.style.top = snappy(top - areaBounds.top, 1) + "px";

            // set a custom event for other elements to respond to (e.g. cables)
            // var event = createCustomMoveEvent(x, y);
            // element.dispatchEvent(event);
        };

        let mouseMove = event => moveElement(event.clientX, event.clientY, 1);

        boundsElement.addEventListener("mousemove", mouseMove);

        boundsElement.addEventListener("mouseup", event => {
            boundsElement.removeEventListener("mousemove", mouseMove);
            moveElement(event.clientX, event.clientY, snap);
            draggedElement.dataset.isDragged = false;
        }, {once: true});
    };

    // don't do it on buttons
    for(let child of draggedElement.querySelectorAll("button")) {
        child.addEventListener("mousedown", event => {
            event.stopPropagation();
        });
    }
}

export function cloneFromTemplate(queryStr, parent, customProcessor=null) {
    parent = parent || document.querySelector("main");

    let fragment = document.querySelector(queryStr).content.cloneNode(true);
    let rootElement = fragment.firstElementChild; // by convention we assume there is only one element anyways
    if(customProcessor) {
        customProcessor(fragment);
    }
    // elementsRegister(fragment, parent);
    parent.append(fragment);
    return rootElement;
}

if(typeof window !== 'undefined') {
    // @ts-ignore
    window.cloneFromTemplate = cloneFromTemplate;
} 

/**
 * @param {HTMLElement} root 
 * @param {HTMLElement} bounds 
 */
export function elementsRegister(root, bounds) {
    // elements that are protected from drag actions, other kinds of default actions
    
    for(let e of root.querySelectorAll(".resource-link")) {
        e.onclick = evt => {
            evt.preventDefault();
        }
    }

}

export function init() {
    console.log("init ui...")
    // let bounds = document.querySelector("body");
    // elementsRegister(bounds, document.querySelector("main"));
}

/**
 *          
 * @param {HTMLElement} elmt 
 */
export function findWindowPos(elmt) {
    let boundsElmt = document.querySelector("main");
    let meRect = elmt.getBoundingClientRect();
    let bounds = boundsElmt.getBoundingClientRect();
    let others = 
        new Array(...boundsElmt.querySelectorAll(".card"))
        .filter(x => x != elmt)
        .map(x => x.getBoundingClientRect())
    ;

    let cans = [];

    let freeAt = (rect) => {
        for(let otherRect of others) {
            if(rectIntersect(rect, otherRect)) {
                return false;
            }
        }
        return true;
    }

    if(freeAt(meRect)) {
        cans.push(meRect);
    }

    for(let otherRect of others) {
        // check right
        let p1 = new DOMRect(otherRect.right, otherRect.y, meRect.width, meRect.height);
        if(freeAt(p1)) cans.push(p1)
        // check down
        let p2 = new DOMRect(otherRect.x, otherRect.bottom, meRect.width, meRect.height);
        if(freeAt(p2)) cans.push(p2)
    }
    cans = cans.filter(x => rectInside(x, bounds));
    if(cans.length == 0) 
        return new DOMRect(bounds.left, bounds.top, meRect.width, meRect.height);
    let norm = rect => rect.y * 10000 + rect.x;
    let result = cans.reduceRight((a,b) => norm(a) < norm(b)? a : b);
    // console.log(result)
    return result;
}
