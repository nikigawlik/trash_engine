import { Card, createCard, LogWindow } from "./components.mjs";
import { deleteDatabase } from "./database.mjs";
import { html } from "./deps.mjs";
import { data, load as dataLoad, save as dataSave } from "./globalData.mjs";
import { ResourceManager } from "./resource_manager.mjs";


// ---

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
            <li><button onclick=${() => save()}>save</button></li>
            <li><button onclick=${() => load()}>load</button></li>
            <li><button onclick=${async() => deleteDatabase()}>DELETE DATA</button></li>
    </ul>
    `;
    return elmt;
}

export let SettingsWindow = (attrs = {}, ...children) => {
    let elmt = html`
    <${Card} name="editor settings">
        <label>dark mode \xa0 <input type="checkbox" /></label>
        <label>full resource hierarchy \xa0 <input type="checkbox" /></label>
    <//>
    `;

    let inputs = elmt.querySelectorAll("input");
    inputs[0].checked = data.editor.settings.darkMode;
    inputs[0].onclick = () => {
        data.editor.settings.darkMode = inputs[0].checked;
        applySettings();
    };
    inputs[1].checked = data.editor.settings.subFolders;
    inputs[1].onclick = () => {
        data.editor.settings.subFolders = inputs[1].checked;
        ResourceManager.resourceManager.refresh();
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


export async function load() {
    console.log("load app...");
    await dataLoad();
    applySettings();
    document.body.innerHTML = "";
    let body = html`<${Body}><//>`;
    document.body.append(...body);
    // let resWindow = html`<${ResourceWindow} resourceManager=${resourceManager}><//>`;
    ResourceManager.resourceManager.load();
    let resWindow = ResourceManager.resourceManager.render();
    document.querySelector("main").append(resWindow);
}

function applySettings() {
    document.querySelector("html").dataset.dark = data.editor.settings.darkMode;
}


function save() {
    dataSave();
    ResourceManager.resourceManager.save();
}