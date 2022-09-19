import { sveltekit } from '@sveltejs/kit/vite';
import mkcert from'vite-plugin-mkcert';
import path from 'path';

/** @type {import('vite').UserConfig} */
const config = {
	plugins: [
		sveltekit(),
		mkcert(),
	],
	server: {
		host: "192.168.0.140",
		https: true,
		// proxy: {},
	},
	// base: "",
	// resolve: {
	// 	alias: [
	// 		{ find:/^(.*)\.js$/, replacement: '$1.alias' }
	// 	]
	// }
};

export default config;
