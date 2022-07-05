import { appendCard, Card, cards } from "./components.mjs";
import { html } from "./deps.mjs";
import { data } from "./globalData.mjs";
import { Resource } from "./resource.mjs";
import { bringToFront } from "./ui.mjs";

export class Room extends Resource {
    constructor(name = "room", resourceManager = null) {
        super(name, resourceManager);
        this.width = 540 * (5/4);
        this.height = 540;
    }
    openEditorWindow() {
        // look for existing
        let existing = cards.find(x => x.dataset.resourceUuid == this.uuid);
        
        if(existing) {
            bringToFront(existing);
        } else {
            let elmt = html`
            <${RoomWindow} room=${this} />
            `;
            appendCard(elmt);
            if(data.editor.settings.openResourcesMaximized) {
                // TODO hacky
                elmt.querySelector("button.maxWindow").click();
            }
        }  
    }
}


let RoomWindow = (attrs={ room: null }, ...children) => {
    let self = attrs.room;
    let elmt = html`
         <${Card} name=${self.name} resourceUUID=${self.uuid} class=room-editor>
         <canvas width=${self.width} height=${self.height} />
         <//>
    `;
    return elmt;
}