import { html } from "./deps.mjs";
import { bringToFront, setupDraggable } from "./ui.mjs";

console.log("components.mjs loading")

// ---- save data ----
let data = {};
data.editor = {};

data.editor.settings = {
    darkMode: false,
}

data.editor.cards = []; // TODO card saving here to reload yeag?

// ---- components ----

export let ContextMenu = (attrs = { buttons: ["null"]}) => {
    let elmt = html`
    <ul class="context-menu">
        ${attrs.buttons.map(str => html`<li><button>${str}</button></li>`)}
    </ul>
    `;
    elmt.style.left = "0px";
    elmt.style.right = "0px";
    elmt.onmouseleave = () => elmt.remove();
    elmt.onclick = () => elmt.remove();

    return elmt;
}

export let createContextMenu = (clickEvent, buttons) => {
    let elmt = html`
        <${ContextMenu} buttons=${buttons} />
    `;
    
    let container = document.querySelector("main"); //resourceManager.resourceWindowElmt;

    let rect1 = clickEvent.target.getBoundingClientRect()
    let rect2 = container.getBoundingClientRect();
    let off = 5;
    bringToFront(elmt);

    elmt.style.left = clickEvent.offsetX + rect1.left - rect2.left - off + "px";
    elmt.style.top = clickEvent.offsetY + rect1.top - rect2.top - off + "px";

    // clickEvent.target.append(contextWindow);
    container.append(elmt);
    return elmt;
}

export let createBlockingPopup = (prompt="null", buttons=["ok"]) => {
    let elmt = html`
        <div class="overlay">
            <div class="popup">
                ${prompt}
                <ul class=horizontal>
                    ${buttons.map(str => html`<li><button>${str}</button></li>`)}
                </ul>
            </div>
        </div>
    `;
    document.body.append(elmt);
    return elmt;
}

export let asyncYesNoPopup = async (question) => {
    let popupElmt = createBlockingPopup(
        html`<p>${question}</p>`, 
        ["yes", "no"]
    );     
    let buttonElmts = popupElmt.querySelectorAll("button"); 
    let result = await new Promise(resolve => { 
        buttonElmts[0].onclick = () => resolve(true); 
        buttonElmts[1].onclick = () => resolve(false); 
    });
    popupElmt.remove();
    return result;
};

export let asyncGetTextPopup = async (question, defaultText, hasCancel=true) => {
    let popupElmt = createBlockingPopup(
        html`
            <p>${question}</p>
            <p><input type="text" value=${defaultText}/></p>
        `,
        (hasCancel? ["ok", "cancel"] : ["ok"])
    );     
    let buttonElmts = popupElmt.querySelectorAll("button");
    let inputElmt = popupElmt.querySelector("input");
    inputElmt.focus();
    inputElmt.select();
    let result = await new Promise(resolve => { 
        buttonElmts[0].onclick = () => resolve(inputElmt.value);
        inputElmt.onkeyup = event => (event.key == 'Enter') && resolve(inputElmt.value); 
        if(hasCancel) buttonElmts[1].onclick = () => resolve(null);
    });
    popupElmt.remove();
    return result;
};

export let createCard = (cardGenerator) => {
    // let positionCandidates = [];
    // for(let existingCard of cards) {
    //     let rect = existingCard.getBoundingClientRect();
    //     let p1 = [rect.left + rect.width, recht.top];
    //     let p2 = [rect.left, recht.top + recht.height];
    //     for(let p of [p1, p2]) {
    //         positionCandidates.push(p);
    //     }
    // }
    let elmt = html`<${cardGenerator} />`;
    appendCard(elmt);
};

export let appendCard = (cardElmt) => {
    // TODO find good place for card
    // let updog = cards.filter(x => x != cardElmt).reduce((a, b) => a.style.zIndex > b.style.zIndex? a : b);
    // let updog = cards.filter(x => x != cardElmt).reduceRight((a,_) => a);
    // const rect = updog.getBoundingClientRect();
    // cardElmt.style.left = rect.left + rect.width + "px";
    // cardElmt.style.top = rect.top + rect.top + "px";
    document.querySelector("main").append(cardElmt);
}

export let cards = [];

export let Card = (attrs = {}, ...children) => {
    let resourceUUID = attrs.resourceUUID || 'none';
    let elmt = html`
    <section class="card" data-resource-uuid=${resourceUUID}>
    <div class="inner-card">
        <h3><span class="name">${attrs.name}</span> <button class="closeWindow">🞩</button></h3>
        ${children.map(x => html`${x}`)}
    </div>
    </section>`;

    elmt.classList.add(attrs.class);

    elmt.querySelector("button.closeWindow").onclick = () => {
        cards = cards.filter(x => x != elmt);
        elmt.remove();
    }

    elmt.onresize = event => {
        event.stopPropagation();
    };

    setupDraggable(elmt, document.querySelector("main"), "h3,.inner-card", 1);

    cards.push(elmt);

    return elmt;
};

let ErrorWindow = (attrs) => {
    return html`
    <${Card} name="an error occured\xa0">
        <p class="error-msg">
            <p>at: ${attrs.line}/${attrs.column}</p>
            <p>${attrs.errorName}</p>
            <p>${attrs.errorMessage}</p>
        </p>
    <//>
    `;
}

let loggers = [];
window.log = (obj) => {
    loggers = loggers.filter(x => x && x.append);
    for(let logger of loggers) {
        logger.append(obj);
        logger.append(document.createElement("br"));
    }
}

export let LogWindow = (attrs) => {
    let elmt = html`
    <${Card} name="log\xa0" class="log">
        <p class="log">
        </p>
    <//>
    `;
    loggers.push(elmt.querySelector("p.log"));
    return elmt;
}

window.testCreateSettings = () => {
    for(let e of document.querySelectorAll("main")) {
        let test2 = html`
        <${SettingsWindow}><//>
        `
        e.append(test2);
    }
}

window.testCreateScript = () => {
    for(let e of document.querySelectorAll("main")) {
        let test2 = html`
        <${ScriptWindow}><//>
        `
        e.append(test2);
    }
}



