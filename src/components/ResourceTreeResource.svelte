<script lang="ts">
    // let extra = this.type == "folder"? html`<button>+</button>` : "";
    let icon = html`<span class="icon">${this.getIconElement()}</span>`; // icon-${this.type} 

    /** @type HTMLElement */ let elmt = html`
        <span draggable="true" class="grabbable">
            <span class=${`resource-link  resource-${this.type}`}>
                ${icon}
                ${this.name} 
            </span>
        </span>
    `;

    // if(extra) {
    //     extra.addEventListener("click", () => { 
    //         document.querySelector("main").append(html`<${Card} name=test><p>test card</p><//>`)
    //     });
    // }
    
    function onclick()  {
        this.openResource(evt);
    }

    function ondragover()  evt.preventDefault());
    function ondragenter()  {
        evt.preventDefault();
        elmt.classList.add('drag-hover')
    }
    function ondragleave()  {
        evt.preventDefault()
        elmt.classList.remove('drag-hover')
    }
    function ondragstart()  {
        evt.dataTransfer.setData('text/uuid', this.uuid);
        // console.log("src: " + this.uuid)
    }
    function ondrop()  { 
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
    }
    return elmt;
}