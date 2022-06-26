import { createContextMenu } from "./components.mjs";
import { html } from "./deps.mjs";
import { Resource } from "./resource.mjs";


export class Folder extends Resource {
    constructor(name = "folder", resourceManager = null, contents = [], resourceType = null) {
        super(name, resourceManager);
        this.contents = [];
        for (let x of contents) {
            this.add(x);
        }
        this.resourceType = resourceType;
    }

    openResource(clickEvent) {
        let resourceConstructor = this.getTopFolder().resourceType;
        let resourceType = resourceConstructor.name.toLowerCase();
        let options = [`new ${resourceType}`, "new folder"];
        if (!this.isTopFolder())
            options.push("delete folder");

        let contextMenu = createContextMenu(clickEvent, options);
        let buttons = contextMenu.querySelectorAll("button");
        buttons[0].onclick = () => {
            this.add(new resourceConstructor());
            this._resourceManager.refresh();
        };
        buttons[1].onclick = () => {
            this.add(new Folder());
            this._resourceManager.refresh();
        };
        // optional
        if (buttons[2])
            buttons[2].onclick = async () => {
                let confirmed = await asyncYesNoPopup(html`Delete folder <em>${this.name}</em>?`);
                if (confirmed) {
                    this.remove();
                    this._resourceManager.refresh();
                }
            };
    }

    add(resource) {
        if (resource._parent)
            resource._parent.remove(resource);
        this.contents.push(resource);
        resource._parent = this;
        resource._resourceManager = this._resourceManager;
    }

    insert(resource, beforeResource) {
        let index = this.contents.indexOf(beforeResource);
        if (index >= 0) {
            resource._parent.remove(resource);
            this.contents.splice(index, 0, resource);
            resource._parent = this;
            return true;
        } else {
            return false;
        }
    }

    remove(resource) {
        if (resource == undefined && this._parent && !this.isTopFolder()) {
            this._parent.remove(this);
        } else {
            let index = this.contents.indexOf(resource);
            if (index >= 0) {
                resource = this.contents.splice(index, 1);
                resource._parent = null;
                return resource;
            } else {
                return null;
            }
        }
    }

    findByUUID(uuid) {
        for (let resource of this.contents) {
            if (resource.uuid == uuid) {
                return resource;
            }
            if (resource.type == "folder") {
                let subResult = resource.findByUUID(uuid);
                if (subResult)
                    return subResult;
            }
        }
        return null;
    }
}
