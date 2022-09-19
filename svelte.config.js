import adapterStatic from '@sveltejs/adapter-static';
import preprocess from 'svelte-preprocess';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://github.com/sveltejs/svelte-preprocess
	// for more information about preprocessors
	preprocess: preprocess(),

	kit: {
		adapter: adapterStatic({
		  // default options are shown. On some platforms
		  // these options are set automatically — see below
		  pages: 'build',
		  assets: 'build',
		  fallback: '200.html',
		  precompress: false
		}),
		// paths: {
		// 	// base: "/html/6505839/build", // copy pasted this from itch lol
		// 	base: "",
		// },
		prerender: {
			// This can be false if you're using a fallback (i.e. SPA mode)
			default: true,
			// enabled: false,
			// crawl: false,
			// entries: [],
		},
		// alias: {
		// 	"/": "",
		// }
	}
};

export default config;
