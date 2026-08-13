/** @type {import('./$types').LayoutServerLoad} */
export async function load({ locals, cookies }) {
    return {
        language: locals.lang,
        langChoice: cookies.get("lang") ?? "auto",
        audio: cookies.get("audio") !== "off",
        rate: Number(cookies.get("rate")) || 1,
    };
}
