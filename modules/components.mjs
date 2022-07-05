import { html } from "./deps.mjs";
import { bringToFront, findWindowPos, setupDraggable } from "./ui.mjs";

console.log("components.mjs loading")

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

export let openCard = (generator, existingCheck=null) => {
    let existing = null;
    if(existingCheck) {
        existing = document.querySelector("main").querySelector(`.card.${existingCheck}`);
    }
    if(existing) {
        bringToFront(existing);
    } else {
        // let elmt = (elementOrGenerator instanceof Function)? html`<${elementOrGenerator} />` : elementOrGenerator;
        // elementsRegister(elmt);
        let elmt = generator();
        appendCard(elmt);
    }
};

export let appendCard = (cardElmt) => {
    let main = document.querySelector("main");
    main.append(cardElmt);
    let bounds = main.getBoundingClientRect();
    let pos = findWindowPos(cardElmt);
    cardElmt.style.left = pos.left - bounds.left + "px";
    cardElmt.style.top = pos.top - bounds.top + "px";
}

export let cards = [];

export let Card = (attrs = {}, ...children) => {
    let resourceUUID = attrs.resourceUUID || 'none';
    let elmt = html`
    <section class="card" data-resource-uuid=${resourceUUID}>
    <div class="inner-card">
        <h3>
            <span class="name">${attrs.name}</span> 
            <span>
                <button class="maxWindow">☐</button>
                <button class="closeWindow">🞩</button>
            </span>
        </h3>
        ${children.map(x => html`${x}`)}
    </div>
    </section>`;

    elmt.classList.add(attrs.class);

    elmt.querySelector("button.closeWindow").onclick = () => {
        cards = cards.filter(x => x != elmt);
        elmt.remove();
    };

    let maxWindowBut = elmt.querySelector("button.maxWindow");
    

    // click
    let memory = null;
    maxWindowBut.onclick = () => {
        if(maxWindowBut.innerText == "☐") {
            let rect = elmt.getBoundingClientRect();
            memory = { 
                width: elmt.style.width || rect.width + "px", 
                height: elmt.style.height || rect.height + "px", 
                left: elmt.style.left, top: elmt.style.top 
            };
            elmt.style.position = "static";
            elmt.style.width = "100%";
            elmt.style.height = "100%";
            elmt.style.resize = "none";
            bringToFront(elmt);
            console.log("front")
            maxWindowBut.innerText = "❐";
        } else {
            if(memory) {
                elmt.style.width = memory.width;
                elmt.style.height = memory.height;
                elmt.style.left = memory.left;
                elmt.style.top = memory.top;
                elmt.style.resize = "both";
                elmt.style.position = "absolute";
                memory = null;
            }
            maxWindowBut.innerText = "☐";
        }
    };

    setupDraggable(elmt, document.querySelector("main"), "h3,h3 *,.inner-card", 1);

    cards.push(elmt);

    return elmt;
};

export let ErrorWindow = (attrs = {line: 0, column: 0, errorName:"error", errorMessage: "..."}) => {
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

window.testCreateScript = () => {
    for(let e of document.querySelectorAll("main")) {
        let test2 = html`
        <${ScriptWindow}><//>
        `
        e.append(test2);
    }
}



