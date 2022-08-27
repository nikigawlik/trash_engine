<script lang="ts">
import type Resource from "src/modules/structs/resource";
    export let resource: Resource;

    let hover: boolean = false;
    
    function onclick(evt: MouseEvent)  {
        resource.openResource(evt);
    }

    function ondragover(evt: DragEvent) {
        evt.preventDefault();
    }  
    function ondragenter(evt: DragEvent)  {
        hover = true;
    }
    function ondragleave(evt: DragEvent)  {
        hover = false;
    }
    function ondragstart(evt: DragEvent)  {
        evt.dataTransfer?.setData('text/uuid', resource.uuid);
        // console.log("src: " + uuid)
    }
    function ondrop(evt: DragEvent)  { 
        evt.preventDefault() 
        hover = false;

        let otherUUID = evt.dataTransfer?.getData("text/uuid");
        if(otherUUID) {
            // console.log(otherUUID);
            let topFolder = resource.getTopFolder();
            const _resourceManager = resource._resourceManager;
            if(topFolder) {
                let other = _resourceManager.findByUUIDInFolder(otherUUID, topFolder.name);
                if(!other) {
                    console.log(`could not find ${otherUUID} / ${topFolder.name}`)
                } else if(other.isParentOf(resource)) {
                    console.log(`can't move parent into child folder`)
                } else if(other == resource) {
                    console.log(`can'resource.t move something into itself`)
                } else if(resource.type == "folder") {
                    resource.add(other);
                    // _resourceManager.refresh();
                } else {
                    resource._parent?.insert(other, resource);
                    // _resourceManager.refresh();
                }
            } else {
                console.log(`can't move into top folders / detached tree`)
            }
        }
    }
</script>


<span draggable="true" class="grabbable" class:drag-hover={hover}
{onclick}
{ondragover}
{ondragenter}
{ondragleave}
{ondragstart}
{ondrop}
>

<span class={`resource-link  resource-${resource.type}`}>
    <span class="icon">{resource.getIconElement()}</span>
    {resource.name} 
    </span>
</span>