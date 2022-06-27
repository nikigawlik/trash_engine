console.log("ui.mjs loading")

let notLikethis = 180;
let maxZ = 0;

export function bringToFront(cardElement) {
    cardElement.style.zIndex = ++maxZ;
}

export function setupDraggable(draggedElement, boundsElement, handleQuery, snap = 16, initialX = notLikethis, initialY = notLikethis) {
    draggedElement.style.left = `0px`;
    draggedElement.style.top = `0px`;
    bringToFront(draggedElement);
    draggedElement.onmousedown = function(event) {
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
}

export function cloneFromTemplate(queryStr, parent, customProcessor=null) {
    parent = parent || document.querySelector("main");

    let fragment = document.querySelector(queryStr).content.cloneNode(true);
    let rootElement = fragment.firstElementChild; // by convention we assume there is only one element anyways
    if(customProcessor) {
        customProcessor(fragment);
    }
    elementsRegister(fragment, parent);
    parent.append(fragment);
    return rootElement;
}
window.cloneFromTemplate = cloneFromTemplate;

/**
 * @param {HTMLElement} root 
 * @param {HTMLElement} bounds 
 */
export function elementsRegister(root, bounds) {
    // elements that are protected from drag actions, I think
    for(let child of root.querySelectorAll("button")) {
        child.addEventListener("mousedown", event => {
            event.stopPropagation();
        });
    }
    
    for(let e of root.querySelectorAll(".resource-link")) {
        e.onclick = evt => {
            evt.preventDefault();
        }
    }

}

export function init() {
    console.log("init ui...")
    let bounds = document.querySelector("body");
    elementsRegister(bounds, document.querySelector("main"));
}

/**
 *          
 * @param {HTMLElement} elmt 
 */
export function findWindowPos(elmt) {
    let boundsElmt = document.querySelector("main");
    let meRect = elmt.getBoundingClientRect();
    let bounds = boundsElmt.getBoundingClientRect();
    let others = new Array(...boundsElmt.querySelectorAll(".card")).map(x => x.getBoundingClientRect());
    console.log(others.length)
    console.log(others)
    console.log(bounds)

    let cans = [];

    let freeAt = (rect) => {
        for(let otherRect of others) {
            if(rectIntersect(rect, otherRect)) {
                return false;
            }
        }
        return true;
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
    console.log(result)
    return result;
}

/**
 * @param {DOMRect} rect1 
 * @param {DOMRect} rect2 
 * @returns {boolean}
 */
function rectIntersect(rect1, rect2) {
    // let rect1 = document.body.getBoundingClientRect()
    // let rect2 = document.body.getBoundingClientRect()
    return rect1.left < rect2.right && rect1.right > rect2.left &&
        rect1.bottom > rect2.top && rect1.top < rect2.bottom;
}

/**
 * @param {DOMRect} rect1 
 * @param {DOMRect} rect2 
 * @returns {boolean}
 */
function rectInside(rect, bounds) {
    return rect.right <= bounds.right && rect.left >= bounds.left && rect.top >= bounds.top && rect.bottom <= bounds.bottom;
}