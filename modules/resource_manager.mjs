// -- data structure --

import { Card } from "./components.mjs";
import { html } from "./deps.mjs";
import { elementsRegister } from "./ui.mjs";


/** @type {ResourceManager} */ export let resourceManager;

export class ResourceManager {
    constructor() {
        this.root = new Folder("root",
            [
                new Folder("sprites"),
                // new Folder("things"),
                new Folder("rooms"),
            ]
        );
        this.resourceWindowElmt = null;
    }

    static init() {
        resourceManager = new ResourceManager();
    }

    addResource(folderName, resource) {
        let folder = this.root.contents.find(x => x.name == folderName);
        folder.add(resource);
    }

    addSprite(sprite) { this.addResource("sprites", sprite); }
    // addThing(thing) { this.addResource("things", thing); }
    addRoom(room) { this.addResource("rooms", room); }

    toJSON() {
        return this.root;
    }

    findByUUIDInFolder(uuid, folderName) {
        let folder = this.root.contents.find(x => x.name == folderName);
        let result = folder.findByUUID(uuid);
        if(!result) return null;
        else return result;
    }

    render() {
        let elmt = html`
        <${ResourceWindow}><//>
        `;
        this.resourceWindowElmt = elmt;
        this.refresh();
        return elmt;
    }

    refresh() {
        if(!this.resourceWindowElmt) return;
        this.resourceWindowElmt.querySelector("ul.resources")?.remove();
        this.resourceWindowElmt.querySelector("div.scroll-box").append(resourceList(this.root.contents));
        elementsRegister(this.resourceWindowElmt.querySelector("ul.resources"));
    }
}
let ResourceWindow = (attrs = {}) => {
    let elmt = html`
    <${Card} name=resources class=resources>
        <div class="scroll-box">
        </div>
    <//>
    `
    return elmt;
}

// helper html generator, not a component generator function!
let resourceList = (resources) => {
    return html`
    <ul class="resources">
        ${resources.map(x => html`
            <li class="icon-folder">
                <${ResourceSubtree} subtree=${x.contents} name=${x.name} self=${x}><//>
            </li>
        `)}
    </ul>
    `;
}

let ResourceSubtree = (attrs = {}, ...children) => {
    let subtree = attrs.subtree;
    if(attrs.self.type == "folder") {
        return html`
        ${attrs.self.render()}<ul>
        ${subtree.map(x => html`
            <li class=${"icon-" + x.type}>
                <${ResourceSubtree} subtree=${x.contents} name=${x.name} self=${x}><//>
            </li>
        `)}
        </ul>
        `
    } else {
        return attrs.self.render();
    }
}


export class Resource {
    constructor(name=null, type="resource") {
        this.name = name;
        this.type = type;
        this._parent = null;
        this.uuid = crypto.randomUUID();
    }

    getTopFolder() {
        let current = this;
        while(current._parent && current._parent != resourceManager.root) {
            current = current._parent;
        }
        // if(current == this) return null;
        return current;
    }

    isParentOf(resource) {
        let current = resource;
        while(current) {
            current = current._parent;
            if(current == this) return true;
        }
        return false
    }

    openWindow() {
        console.log(`no window implemented for ${this.type}`);
    }

    render(attrs={}, ...children) {
        // let extra = this.type == "folder"? html`<button>+</button>` : "";
        /** @type HTMLElement */ let elmt = html`
            <p draggable="true" class="grabbable"><span href="" class=${`resource-link  resource-${this.type}`} >${this.name}</span></p>
        `;

        // if(extra) {
        //     extra.addEventListener("click", () => { 
        //         document.querySelector("main").append(html`<${Card} name=test><p>test card</p><//>`)
        //     });
        // }
        
        elmt.addEventListener('click', evt => {
            this.openWindow();
        });
        

        elmt.addEventListener('dragover', evt => evt.preventDefault());
        elmt.addEventListener('dragenter', evt => {
            evt.preventDefault();
            elmt.classList.add('drag-hover')
        });
        elmt.addEventListener('dragleave', evt => {
            evt.preventDefault()
            elmt.classList.remove('drag-hover')
        });
        elmt.addEventListener('dragstart', evt => {
            evt.dataTransfer.setData('text/uuid', this.uuid);
            // console.log("src: " + this.uuid)
        })
        elmt.addEventListener('drop', evt => { 
            evt.preventDefault() 
            elmt.classList.remove('drag-hover')

            let otherUUID = evt.dataTransfer.getData("text/uuid");
            // console.log(otherUUID);
            let topFolder = this.getTopFolder();
            if(topFolder) {
                let other = resourceManager.findByUUIDInFolder(otherUUID, topFolder.name);
                if(!other) {
                    console.log(`could not find ${otherUUID} / ${topFolder.name}`)
                } else if(other.isParentOf(this)) {
                    console.log(`can't move parent into child folder`)
                } else if(other == this) {
                    console.log(`can't move something into itself`)
                } else if(this.type == "folder") {
                    this.add(other);
                    resourceManager.refresh();
                } else {
                    this._parent.insert(other, this);
                    resourceManager.refresh();
                }
            } else {
                console.log(`can't move into top folders / detached tree`)
            }
        });
        return elmt;
    }
}

export class Folder extends Resource {
    constructor(name="folder", contents=[]) {
        super(name, "folder");
        this.contents = contents;
        for(let x of contents) {
            x._parent = this;
        }
    }

    add(resource) {
        if(resource._parent) resource._parent.remove(resource);
        this.contents.push(resource);
        resource._parent = this;
    }

    insert(resource, beforeResource) {
        let index = this.contents.indexOf(beforeResource);
        if(index >= 0) {
            resource._parent.remove(resource);
            this.contents.splice(index, 0, resource);
            resource._parent = this;
            return true;
        } else {
            return false;
        }
    }

    remove(resource) {
        let index = this.contents.indexOf(resource);
        if(index >= 0) {
            resource = this.contents.splice(index, 1);
            resource._parent = null;
            return resource;
        } else {
            return null;
        }
    }

    findByUUID(uuid) {
        for(let resource of this.contents) {
            if(resource.uuid == uuid) {
                return resource;
            }
            if(resource.type == "folder") {
                let subResult = resource.findByUUID(uuid);
                if(subResult) return subResult;
            }
        }
        return null;
    }
}

// export class Thing extends Resource {
//     constructor(name="thing") {
//         super(name, "thing");
//         this.name = name;
//     }
// }

export class Room extends Resource {
    constructor(name="room") {
        super(name, "room");
        this.name = name;
    }
}


// -- components --
