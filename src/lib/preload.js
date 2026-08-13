import { LoadingManager, TextureLoader } from "three";
import {
    aynIcon,
    nafisIcon,
    rahhalIcon,
    waddahIcon,
} from "$lib/assets/planeticons";

const DELAY = 0;

const TEXTURES = {
    "/textures/rahhal_clouds.png": 2275,
    "/textures/starmap_muted.jpg": 1854,
    "/textures/ayn_clouds.png": 1741,
    "/textures/ayn_color.jpg": 972,
    "/textures/fasil_color.jpg": 755,
    "/textures/waddah_color.jpg": 586,
    "/textures/rahhal_color.jpg": 522,
    "/textures/fasil_prom.jpg": 355,
    "/textures/nafis_color.jpg": 307,
    "/textures/fasil_disp.png": 217,
    "/textures/nafis_clouds_alpha.png": 126,
    "/textures/waddah_ring.png": 9,
    "/textures/rahhal_ring.png": 4,
};

const ICONS = [
    [waddahIcon, 95],
    [aynIcon, 67],
    [nafisIcon, 55],
    [rahhalIcon, 50],
];

const FONTS = 105;

const TOTAL =
    Object.values(TEXTURES).reduce((a, b) => a + b, 0) +
    ICONS.reduce((a, [, kb]) => a + kb, 0) +
    FONTS;

export function preloadAll(onProgress) {
    let done = 0;
    const tick = (kb) => {
        done += kb;
        onProgress?.(Math.min(done / TOTAL, 1));
    };

    const loader = new TextureLoader(new LoadingManager());

    const jobs = Object.entries(TEXTURES).map(
        ([url, kb]) =>
            new Promise((resolve) => {
                const finish = () => {
                    setTimeout(
                        () => {
                            tick(kb);
                            resolve();
                        },
                        (kb / 100) * DELAY,
                    );
                };
                loader.load(url, finish, undefined, finish);
            }),
    );

    for (const [url, kb] of ICONS) {
        const img = new Image();
        img.src = url;
        jobs.push(
            img
                .decode()
                .catch(() => { })
                .then(() => tick(kb)),
        );
    }

    jobs.push(document.fonts.ready.then(() => tick(FONTS)));

    return Promise.all(jobs);
}