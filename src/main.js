// import './app.css'
// import Main from './components/Main.svelte'
import { getDocumentGameData as getDocumentGameData } from "./lib/modules/database";
import Game from "./lib/routes/game.svelte";
import Index from "./lib/routes/index.svelte"

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

let app;
let customGameData = getDocumentGameData();
let isGame = (urlParams.has("game") || customGameData) && !urlParams.has("editor");

if(isGame) {
  app = new Game({
    // target: document.getElementById('app')
    target: document.body,
  })
} else {
  app = new Index({
    // target: document.getElementById('app')
    target: document.body,
  })
}

export default app
