// import './app.css'
// import Main from './components/Main.svelte'
import { getDocumentGameData } from "./lib/modules/database";
// @ts-ignore
import Game from "./lib/routes/game.svelte";
// @ts-ignore
import Index from "./lib/routes/index.svelte";
// @ts-ignore
import Testpage from "./lib/routes/testPage.svelte";

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

let app;

// decide which context to open the app as, (mostly determined by query params)
let customGameData = getDocumentGameData();
let isGame = urlParams.has("game") || !!customGameData;
let isEditor = urlParams.has("editor");
let isTestpage = urlParams.has("testpage");

// game has precedence, but can be overridden by editor
if(isGame && !isEditor) {
  app = new Game({
    // target: document.getElementById('app')
    target: document.body,
  })
} 
// testpage
else if(isTestpage) {
  app = new Testpage(({
    target: document.body,
  }))
} 
// default: editor
else {
  app = new Index({
    // target: document.getElementById('app')
    target: document.body,
  })
}

export default app
