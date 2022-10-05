// import './app.css'
// import Main from './components/Main.svelte'
import Index from "./lib/routes/index.svelte"

const app = new Index({
  // target: document.getElementById('app')
  target: document.body,
})

export default app
