import { sveltekit } from '@sveltejs/kit/vite';
import mkcert from'vite-plugin-mkcert';

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
};

export default config;
