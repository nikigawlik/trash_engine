import Game from "./lib/routes/game.svelte"

const app = new Game({
  // target: document.getElementById('app')
  target: document.body,
})

export default app
