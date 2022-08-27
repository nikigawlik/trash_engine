import { rectIntersect, rectInside } from "./utils";

console.log("ui module loading")


export function setupDraggable(draggedElement: HTMLElement, params: { boundsElement: HTMLElement; handleQuery: string; snap: number; }) {
    let boundsElement : HTMLElement, handleQuery: string, snap: number;
    ({boundsElement, handleQuery, snap} = params);

    if(!window) return;
    
    draggedElement.style.left = `0px`;
    draggedElement.style.top = `0px`;

    draggedElement.style.position = 'absolute';
    console.log("draggable!")
    
    draggedElement.onmousedown = function(event) {
        if(window.getComputedStyle(draggedElement).position != "absolute") {
            return;
        }
        // TODO reimplement
        // bringToFront(draggedElement);
        
        if(!event.target || !(event.target instanceof HTMLElement) || !event.target.matches(handleQuery)) {
            return;
        }

        draggedElement.dataset.isDragged = "true";

        // move to front
        draggedElement.parentElement?.append(draggedElement);

        let rect = draggedElement.getBoundingClientRect();
        let offsetX = rect.left - event.clientX;
        let offsetY = rect.top - event.clientY;

        let snappy = (v: number, s: number) => Math.round(v / s) * s;

        let moveElement = (x: number, y: number, snap = .01) => {
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

        let mouseMove = (event: MouseEvent) => moveElement(event.clientX, event.clientY, 1);

        boundsElement.addEventListener("mousemove", mouseMove);

        boundsElement.addEventListener("mouseup", event => {
            boundsElement.removeEventListener("mousemove", mouseMove);
            moveElement(event.clientX, event.clientY, snap);
            draggedElement.dataset.isDragged = "false";
        }, {once: true});
    };

    // don't do it on buttons
    for(let child of draggedElement.querySelectorAll("button")) {
        child.addEventListener("mousedown", event => {
            event.stopPropagation();
        });
    }
}

// export function cloneFromTemplate(queryStr, parent, customProcessor=null) {
//     parent = parent || document.querySelector("main");

//     let fragment = document.querySelector(queryStr).content.cloneNode(true);
//     let rootElement = fragment.firstElementChild; // by convention we assume there is only one element anyways
//     if(customProcessor) {
//         customProcessor(fragment);
//     }
//     // elementsRegister(fragment, parent);
//     parent.append(fragment);
//     return rootElement;
// }

if(typeof window !== 'undefined') {
    // @ts-ignore
    // window.cloneFromTemplate = cloneFromTemplate;
} 

/**
 * @param {HTMLElement} root 
 * @param {HTMLElement} bounds 
 */
export function elementsRegister(root: HTMLElement, bounds: HTMLElement) {
    // elements that are protected from drag actions, other kinds of default actions
    
    for(let e of root.querySelectorAll(".resource-link")) {
        if(e instanceof HTMLElement) e.onclick = evt => {
            evt.preventDefault();
        }
    }

}

export function init() {
    console.log("init ui...")
    // let bounds = document.querySelector("body");
    // elementsRegister(bounds, document.querySelector("main"));
}

export function findWindowPos(elmt: HTMLElement) {
    let boundsElmt = document.querySelector("main");
    let meRect = elmt.getBoundingClientRect();
    if(!boundsElmt) return meRect;
    let bounds = boundsElmt.getBoundingClientRect();
    let others = 
        new Array(...boundsElmt.querySelectorAll(".card"))
        .filter(x => x != elmt)
        .map(x => x.getBoundingClientRect())
    ;

    let cans = [];

    let freeAt = (rect: DOMRect) => {
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
    let norm = (rect: DOMRect) => rect.y * 10000 + rect.x;
    let result = cans.reduceRight((a,b) => norm(a) < norm(b)? a : b);
    // console.log(result)
    return result;
}
