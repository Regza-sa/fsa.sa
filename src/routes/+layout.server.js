/** @type {import('./$types').LayoutServerLoad} */
export async function load({ locals }) {
    return {
        language: locals.lang,
    };
}
