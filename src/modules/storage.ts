import { writable } from "svelte/store"
import * as database from "./database"

export let resources = writable();