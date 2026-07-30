/** @type {import('./$types').LayoutServerLoad} */
export async function load({ request }) {
    const lang = request.headers.get('accept-language');
    return {
        language: lang
    }
}