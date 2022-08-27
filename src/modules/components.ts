// @ts-nocheck
import { html } from "./deps.mjs";

console.log("components.mjs loading")

// ---- components ----




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

export let asyncGetTextPopup = async (question, defaultText, hasCancel=true) : Promise<string> => {
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


export let ErrorWindow = (attrs = {line: 0, column: 0, errorName:"error", errorMessage: "..."}) => {
    return html`
    <${Card} name="an error occured&nbsp">
        <p class="error-msg">
            <p>at: ${attrs.line}/${attrs.column}</p>
            <p>${attrs.errorName}</p>
            <p>${attrs.errorMessage}</p>
        </p>
    <//>
    `;
}


export let LogWindow = (attrs) => {
    let elmt = html`
    <${Card} name="log&nbsp" class="log">
        
    <//>
    `;
    loggers.push(elmt.querySelector("p.log"));
    return elmt;
}



