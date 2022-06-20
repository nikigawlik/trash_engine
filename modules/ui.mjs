import * as components from "./components.mjs";

let notLikethis = 180;
let maxZ = 0;

export function bringToFront(cardElement) {
    cardElement.style.zIndex = ++maxZ;
}

export function setupDraggable(draggedElement, boundsElement, handleQuery, snap = 16, initialX = notLikethis, initialY = notLikethis) {
    draggedElement.style.left = `${notLikethis}px`;
    draggedElement.style.top = `${notLikethis}px`;
    notLikethis += 10; // TODO: NO :p
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

// export function cloneFromTemplate(queryStr, parent, customProcessor=null) {
//     parent = parent || document.querySelector("main");

//     let fragment = document.querySelector(queryStr).content.cloneNode(true);
//     let rootElement = fragment.firstElementChild; // by convention we assume there is only one element anyways
//     if(customProcessor) {
//         customProcessor(fragment);
//     }
//     elementsRegister(fragment, parent);
//     parent.append(fragment);
//     return rootElement;
// }
// window.cloneFromTemplate = cloneFromTemplate;

/**
 * @param {HTMLElement} root 
 * @param {HTMLElement} bounds 
 */
export function elementsRegister(root, bounds) {
    components.elementsBeforeLoad(root);
    
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

    components.elementsLoad(root);
}

// const version = "0_dev";
// function getSaveKey() {
//     return `ngine_v_${version}_saveHTML`;
// }
// export function saveEverything() {
//     let html = document.querySelector("main").innerHTML;
//     let key = getSaveKey();
//     localStorage.setItem(key, html);
// }
// window.saveEverything = saveEverything;

// export function loadEverything() {
//     let key = getSaveKey();
//     let html = localStorage.getItem(key);
//     document.querySelector("main").innerHTML = html;
//     let bounds = document.querySelector("body");
//     elementsRegister(bounds, document.querySelector("main"));
// }
// window.loadEverything = loadEverything;


export function init() {
    components.loadApp();
    console.log("main")
    let bounds = document.querySelector("body");
    elementsRegister(bounds, document.querySelector("main"));
}