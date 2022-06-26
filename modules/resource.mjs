import { asyncGetTextPopup, asyncYesNoPopup, createContextMenu } from "./components.mjs";
import { html } from "./deps.mjs";


console.log("resources.mjs loading")

export class Resource {
    constructor(name=null, resourceManager=null) {
        this.name = name;
        this.type = this.constructor.name.toLowerCase();
        this.uuid = crypto.randomUUID();
        this._parent = null;
        this._resourceManager=resourceManager;
    }

    getTopFolder() {
        let current = this;
        while(current._parent && current._parent != this._resourceManager.root) {
            current = current._parent;
        }
        // if(current == this) return null;
        return current;
    }

    isTopFolder() {
        return this._parent == this._resourceManager.root;
    }

    isParentOf(resource) {
        let current = resource;
        while(current) {
            current = current._parent;
            if(current == this) return true;
        }
        return false
    }

    remove() {
        this._parent.remove(this);
    }

    openResource(clickEvent) {
        let options = this.getContextMenuOptions();
        let contextMenu = createContextMenu(clickEvent, options.map(x => x.text));
        let buttons = contextMenu.querySelectorAll("button");
        for(let i = 0; i < buttons.length; i++) {
            buttons[i].onclick = options[i].callback;
        }
    }

    getContextMenuOptions() {
        return [
            {
                id: "open",
                text: "open",
                callback: () => this.openEditorWindow()
            },
            {
                id: "delete",
                text: `delete`,
                callback: async () => {
                    let confirmed = await asyncYesNoPopup(html`Delete <em>${this.name}</em>?`);
        
                    if(confirmed) {   
                        this.remove();
                        let resourceWindow = document.querySelector(`main .card[data-resource-uuid="${this.uuid}"]`);
                        if(resourceWindow) resourceWindow.remove();
                        this._resourceManager.refresh();   
                    }
                }
            },
            {
                id: "rename",
                text: `rename`,
                callback: async () => {
                    let name = await asyncGetTextPopup(`Choose new name:`, this.name);
                    if(name) {
                        this.name = name;
                        this._resourceManager.refresh();
                        // update name on card
                        let resourceWindow = document.querySelector(`main .card[data-resource-uuid="${this.uuid}"]`);
                        resourceWindow.querySelector("h3 .name").innerText = name; // not super elegant, but ok
                    }
                }
            }
        ];
    }

    openEditorWindow() {
        console.log(`no window implemented for ${this.type}`);
    }

    render(attrs={}, ...children) {
        // let extra = this.type == "folder"? html`<button>+</button>` : "";
        /** @type HTMLElement */ let elmt = html`
            <p draggable="true" class="grabbable"><span class=${`resource-link  resource-${this.type}`} >${this.name}</span></p>
        `;

        // if(extra) {
        //     extra.addEventListener("click", () => { 
        //         document.querySelector("main").append(html`<${Card} name=test><p>test card</p><//>`)
        //     });
        // }
        
        elmt.addEventListener('click', evt => {
            this.openResource(evt);
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
                let other = this._resourceManager.findByUUIDInFolder(otherUUID, topFolder.name);
                if(!other) {
                    console.log(`could not find ${otherUUID} / ${topFolder.name}`)
                } else if(other.isParentOf(this)) {
                    console.log(`can't move parent into child folder`)
                } else if(other == this) {
                    console.log(`can't move something into itself`)
                } else if(this.type == "folder") {
                    this.add(other);
                    this._resourceManager.refresh();
                } else {
                    this._parent.insert(other, this);
                    this._resourceManager.refresh();
                }
            } else {
                console.log(`can't move into top folders / detached tree`)
            }
        });
        return elmt;
    }
}


