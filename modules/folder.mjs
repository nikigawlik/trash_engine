import { asyncGetTextPopup, asyncYesNoPopup, createContextMenu } from "./components.mjs";
import { html } from "./deps.mjs";
import { data } from "./globalData.mjs";
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

    // openResource(clickEvent) {
    // }

    getContextMenuOptions() {
        let defaultOptions = super.getContextMenuOptions();

        let resourceConstructor = this.getTopFolder().resourceType;
        let resourceType = resourceConstructor.name.toLowerCase();
        let options = [
            {
                id: "new_resource",
                text: `new ${resourceType}`, 
                callback: async () => {
                    let name = await asyncGetTextPopup(`Name of the ${resourceType}:`, `unnamed ${resourceType}`);
                    if(name) {    
                        let newResource = new resourceConstructor();
                        newResource.name = name;
                        this.add(newResource);
                        this._resourceManager.refresh();
                    }
                }
            },
        ];
        if(data.editor.settings.subFolders) {
            options.push({
                id: "new_folder",
                text: "new folder", 
                callback: async () => {
                    let name = await asyncGetTextPopup(`Name of the folder:`, `unnamed folder`);
                    if(name) {
                        let newFolder = new Folder();
                        newFolder.name = name;
                        this.add(newFolder);
                        this._resourceManager.refresh();
                    }
                }
            });
        }
        if (!this.isTopFolder()) {
            options.push(
                defaultOptions.find(x => x.id == "rename"),
                defaultOptions.find(x => x.id == "delete"),
            );
        }

        return options;

        // // new <resource>
        // buttons[0].onclick = ;
        // // new folder
        // buttons[1].onclick = ;
        // if (buttons.length > 2) {
        //     // rename
        //     buttons[2].onclick = async () => {
        //         let name = await asyncGetTextPopup(`Name of the folder:`, this.name);
        //         if(name) {
        //             this.name = name;
        //             this._resourceManager.refresh();
        //         }
        //     };
        //     // delete folder 
        //     buttons[3].onclick = async () => {
        //         let confirmed = await asyncYesNoPopup(html`Delete folder <em>${this.name}</em>?`);
        //         if (confirmed) {
        //             this.remove();
        //             this._resourceManager.refresh();
        //         }
        //     };
        // }
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
