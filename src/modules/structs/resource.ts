import ContextMenuSvelte from "./../../components/ContextMenu.svelte";
import { cards, CardType } from "../cardManager";
import type ResourceManager from "../ResourceManager";
import type Folder from "./folder";
import { asyncGetTextPopup, asyncYesNoPopup } from "../components";

console.log("resources.mjs loading")

export default class Resource {
    name: string;
    type: string;
    uuid: string;
    _parent: Folder | null;
    _resourceManager: ResourceManager;
    _icon: HTMLElement | null;
    constructor(name = "", resourceManager: ResourceManager) {
        this.name = name;
        this.type = this.constructor.name.toLowerCase();
        this.uuid = crypto.randomUUID();
        this._parent = null;
        this._resourceManager=resourceManager;
        this._icon = null;
    }

    getTopFolder() {
        let current: Resource = this;
        while(current._parent && current._parent != this._resourceManager.root) {
            current = current._parent;
        }
        // if(current == this) return null;
        return current;
    }

    isTopFolder() {
        return this._parent == this._resourceManager.root;
    }

    isParentOf(resource: Resource) {
        let current: Resource | null = resource;
        while(current) {
            current = current._parent;
            if(current == this) return true;
        }
        return false
    }

    removeSelf(): void  {
        this._parent?.remove(this);
    }

    openResource(clickEvent: MouseEvent) {
        let options = this.getContextMenuOptions();
        // let contextMenu = createContextMenu(clickEvent, options.map(x => x.text));
        let c = cards.add(ContextMenuSvelte, undefined, CardType.ContextMenu)
        // TODO callbacks

        // let buttons = contextMenu.querySelectorAll("button");
        // for(let i = 0; i < buttons.length; i++) {
        //     buttons[i].onclick = options[i].callback;
        // }
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
                    let confirmed = await asyncYesNoPopup(`Delete <em>${this.name}</em>?`); // TODO
        
                    if(confirmed) {   
                        this.removeSelf();
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
                        // TODO
                        // update name on card
                        // let resourceWindow = document.querySelector(`main .card[data-resource-uuid="${this.uuid}"]`);
                        // resourceWindow.querySelector("h3 .name").innerText = name; // not super elegant, but ok
                    }
                }
            }
        ];
    }

    openEditorWindow() {
        console.log(`no window implemented for ${this.type}`);
    }

    getIconElement() {
        return `<span>❔</span>`;
    }

    
    add(other: any) {
        throw new Error("Method not implemented.");
    }

    render(other: any) {
        throw new Error("dON'T Use this..");
    }
}


