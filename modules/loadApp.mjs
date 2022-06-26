import { LogWindow } from "./components.mjs";
import { deleteDatabase } from "./database.mjs";
import { html } from "./deps.mjs";
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
            <li><button onclick=${() => ResourceManager.resourceManager.save()}>save</button></li>
            <li><button onclick=${() => ResourceManager.resourceManager.load()}>load</button></li>
            <li><button onclick=${async() => deleteDatabase()}>DELETE DATA</button></li>
    </ul>
    `;
    return elmt;
}

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


export function loadApp() {
    console.log("load app...");
    let body = html`<${Body}><//>`;
    document.body.append(...body);
    // let resWindow = html`<${ResourceWindow} resourceManager=${resourceManager}><//>`;
    let resWindow = ResourceManager.resourceManager.render();
    document.querySelector("main").append(resWindow);
}
