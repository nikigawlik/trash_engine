import type ResourceManager from "../game/ResourceManager";
import Resource from "./resource";

/**
 * @deprecated
 * 
 * This is only kept to read version 1 save data 
 */
export default class Folder extends Resource {
    contents: Resource[]
    resourceType: typeof Resource | null
    
    constructor(name = "folder", resourceManager?: ResourceManager, contents: Resource[] = [], resourceType: (typeof Resource)|null = null) {
        super(name, resourceManager);
        this.contents = [];
        for (let x of contents) {
            this.add(x);
        }
        this.resourceType = resourceType;
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
