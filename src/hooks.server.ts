import type { Handle, RequestEvent } from "@sveltejs/kit";

export const handle: Handle = async function({ event, resolve }) {
    if (event.url.pathname.startsWith('/custom')) {
      return new Response('custom response');
    }
   
    const response = await resolve(event);
    return response;
}