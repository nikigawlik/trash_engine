import type ResourceManager from "../game/ResourceManager";
import Resource from "./resource";

export default class Folder extends Resource {
    contents: Resource[]
    resourceType: typeof Resource | null
    
    constructor(name = "folder", resourceManager: ResourceManager, contents: Resource[] = [], resourceType: (typeof Resource)|null = null) {
        super(name, resourceManager);
        this.contents = [];
        for (let x of contents) {
            this.add(x);
        }
        this.resourceType = resourceType;
    }

    getIconElement() {
        return `📁`;
    }

    add(resource: Resource) {
        if (resource._parent)
            resource._parent.remove(resource);
        this.contents.push(resource);
        resource._parent = this;
        resource._resourceManager = this._resourceManager;
    }

    insert(resource: Resource, beforeResource: Resource) {
        let index = this.contents.indexOf(beforeResource);
        if (index >= 0) {
            resource.removeSelf();
            this.contents.splice(index, 0, resource);
            resource._parent = this;
            return true;
        } else {
            return false;
        }
    }

    remove(resource: Resource): boolean {
        let index = this.contents.indexOf(resource);
        if (index >= 0) {
            this.contents.splice(index, 1);
            return true;
        } else {
            return false;
        }
    }

    findByUUID(uuid: string): Resource | null {
        for (let resource of this.contents) {
            if (resource.uuid == uuid) {
                return resource;
            }
            if (resource instanceof Folder) {
                let subResult = resource.findByUUID(uuid);
                if (subResult)
                    return subResult;
            }
        }
        return null;
    }

    *iterateAllResources() {
        yield * Folder.iterateResource(this);
    }

    static *iterateResource(resource: Resource): IterableIterator<Resource>  {
        if(resource instanceof Folder) {
            for(let r of resource.contents) {
                yield * Folder.iterateResource(r);
            }
        } else {
            yield resource;
        }
    }
}
