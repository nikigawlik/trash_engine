// @ts-nocheck
import { html } from "./deps.mjs";

console.log("components.mjs loading")

// ---- components ----


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



