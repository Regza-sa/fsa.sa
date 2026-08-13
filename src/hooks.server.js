const SUPPORTED = ["en", "ar"];
const FALLBACK = "en";
const FORCE = null;

function resolveLang(header) {
    if (!header) return FALLBACK;

    const ranked = header
        .split(",")
        .map((part) => {
            const [tag, ...params] = part.trim().split(";");
            const q = params.find((p) => p.trim().startsWith("q="));
            return {
                base: tag.trim().toLowerCase().split("-")[0],
                q: q ? parseFloat(q.split("=")[1]) : 1,
            };
        })
        .filter((entry) => entry.base && !Number.isNaN(entry.q))
        .sort((a, b) => b.q - a.q);

    return ranked.find((entry) => SUPPORTED.includes(entry.base))?.base ?? FALLBACK;
}

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
    const saved = event.cookies.get("lang");
    const lang =
        (SUPPORTED.includes(saved) ? saved : null) ??
        resolveLang(event.request.headers.get("accept-language"));
    const dir = lang === "ar" ? "rtl" : "ltr";

    event.locals.lang = lang;

    return resolve(event, {
        transformPageChunk: ({ html }) =>
            html.replace("%lang%", lang).replace("%dir%", dir),
    });
}