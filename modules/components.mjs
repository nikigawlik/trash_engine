import { html } from "./deps.mjs";
import { resourceManager, ResourceManager } from "./resource_manager.mjs";
import { elementsRegister, setupDraggable } from "./ui.mjs";


// ---- save data ----
let data = {};
data.editor = {};

data.editor.settings = {
    darkMode: false,
}

data.editor.cards = []; // TODO card saving here to reload yeag?

// ---- components ----

export let Body = () => {
    let elmt = html`
    <header>
        <div><img src="engineAssets/icon.png" /><h2>trash engine</h2></div>
        <${TopBar}><//>
    </header>
    <main>
    </main>
    `
    return elmt;
}

export let TopBar = () => {
    let elmt = html`
    <ul class="topbar">
            <!-- <li><button onclick="cloneFromTemplate('#objectEditorCard')">new object</button></li> -->
            <li><button onclick=${() => createCard(ScriptWindow)}>new script</button></li>
            <li><button onclick=${() => createCard(LogWindow)}>new log</button></li>
            <li><button onclick=${() => createCard(SettingsWindow)}>show settings</button></li>
    </ul>
    `;
    return elmt;
}

export let createCard = (cardGenerator) => {
    let elmt = html`<${cardGenerator} />`;
    appendCard(elmt);
};

export let appendCard = (cardElmt) => {
    document.querySelector("main").append(cardElmt);
}

export let cards = [];

export let Card = (attrs = {}, ...children) => {
    let resourceUUID = attrs.resourceUUID || 'none';
    let elmt = html`
    <section class="card" data-resource-uuid=${resourceUUID}>
    <div class="inner-card">
        <h3>${attrs.name} <button class="closeWindow">🞩</button></h3>
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

export let SettingsWindow = (attrs = {}, ...children) => {
    let elmt = html`
    <${Card} name="editor settings">
    <label>dark mode \xa0 <input type="checkbox" /></label>
    <//>
    `;

    let input = elmt.querySelector("input");
    input.checked = data.editor.settings.darkMode;
    input.onclick = () => {
        data.editor.settings.darkMode = input.checked;
        document.querySelector("html").dataset.dark = input.checked;
    };

    return elmt;
}


let ScriptWindow = (attrs = {}, ...children) => {
    let elmt = html`
    <${Card} name="script editor" class="script-editor">
        <p><button title="run" class="play">▶</button></p>
        <textarea cols="40" rows="10"></textarea>
    <//>
    `;

    let playBut = elmt.querySelector("button.play");
    playBut.onclick = () => {
        console.log("run script!");
        let textarea = elmt.querySelector("textarea");
        let scriptText = textarea.value;

        // change the stack trace to custom format (only Chrome / V8)
        Error.prepareStackTrace = function(error, structuredStackTrace) {
            let cs = structuredStackTrace[0];
            return {
                lineNumber: cs.getLineNumber(),
                columnNumber: cs.getColumnNumber(),
            };
        }

        try {
            let f = new Function(scriptText);
            f();
        } catch(e) {
            let line = e.lineNumber || e.stack.lineNumber;
            let column = e.columnNumber || e.stack.columnNumber;

            let errorCard = html`
            <${ErrorWindow} 
            line=${line-2} 
            column=${column} 
            errorName=${e.name} 
            errorMessage=${e.message}/>
            `;
            document.querySelector("main").append(errorCard);
        }
    }

    return elmt
}

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

let LogWindow = (attrs) => {
    let elmt = html`
    <${Card} name="log\xa0" class="log">
        <p class="log">
        </p>
    <//>
    `;
    loggers.push(elmt.querySelector("p.log"));
    return elmt;
}

export function elementsBeforeLoad(root) {
    
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

export function loadApp() {
    let body = html`<${Body}><//>`;
    document.body.append(...body);
    // let resWindow = html`<${ResourceWindow} resourceManager=${resourceManager}><//>`;
    let resWindow = resourceManager.render();
    document.querySelector("main").append(resWindow);
}


export function elementsLoad(root) {
    // let root = document.querySelector("body");
    // brightnessSetting(root);
    // scriptEditor(root);
    // logWindow(root);
}







// test


// let test = html`
// <template id="objectEditorCard">
//         <section class="card obj-editor">
//             <div class="inner-card">
//                 <h3>obj_player <button class="closeWindow">🞩</button></h3>
//                 <div class="flex-row">
//                     <div class="subsection settings">
//                         <h4>settings</h4>
//                         <button class="event start">start</button>
//                         <br/>
//                         <button onclick="cloneFromTemplate('#scriptEditorCard')">new script</button>
//                         <br/>
//                         <button onclick="cloneFromTemplate('#logCard')">new log</button>
//                     </div>
//                     <div class="subsection events">
//                         <h4>events</h4>
//                         <ul class="events">
//                             <li>start</li>
//                             <li>tick</li>
//                             <li>draw</li>
//                             <li>destroy</li>
//                         </ul>
//                     </div>
//                     <div class="subsection actions">
//                         <h4>event actions</h4>
//                         <template id="eventsList">
//                             <ul class="actions">
//                                 {/* <!-- <li>action 1</li> --> */}
//                             </ul>
//                         </template>
//                     </div>
//                     <div class="subsection action-palette">
//                         <h4>main</h4>
//                         <ul class="action-select">
//                             <li>move</li>
//                             <li>jump</li>
//                             <li>teleport</li>
//                             <li>reverse</li>
//                         </ul>
//                     </div>
//                 </div>
//             </div>
//         </section>
//     </template>
// `