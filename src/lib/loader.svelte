<script>
    import { Canvas, T } from "@threlte/core";
    import { HTML } from "@threlte/extras";

    let { progress = 0 } = $props();

    const TILT = 0.4;
    const TILT_Z = 3;
    const SPEED = 1.1;

    const CAM_Z = 5;
    const FOV = 45;
    const BAR_H_PX = 6;

    let vw = $state(1280);
    let vh = $state(800);

    const uPerPx = $derived(
        (2 * CAM_Z * Math.tan((FOV * Math.PI) / 360)) / Math.max(vh, 1),
    );
    const barPx = $derived(Math.min(650, vw * 0.82));
    const orbitR = $derived(barPx * 0.62 * uPerPx);
    const bodyR = $derived(barPx * 0.052 * uPerPx);

    let angle = $state(0);

    $effect(() => {
        let raf;
        let last = performance.now();
        const tick = (now) => {
            angle += ((now - last) / 1000) * SPEED;
            last = now;
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    });
</script>

<svelte:window bind:innerWidth={vw} bind:innerHeight={vh} />

<Canvas>
    <T.PerspectiveCamera makeDefault position={[0, 0, 5]} fov={45} />
    <T.PointLight position={[0, 0, 0]} intensity={10} />
    <T.AmbientLight intensity={0.15} />

    <T.Group rotation.x={TILT} rotation.z={TILT_Z}>
        <T.Group rotation.y={angle}>
            <T.Mesh position={[orbitR, 0, 0]}>
                <T.SphereGeometry args={[bodyR, 32, 16]} />
                <T.MeshStandardMaterial color="#f4f0e6" roughness={0.55} />
            </T.Mesh>
        </T.Group>
    </T.Group>

    <HTML center>
        <div class="box">
            <h1 class="title">fsa.sa</h1>
            <div class="bar" style:width="{barPx}px">
                <div class="fill" style:transform="scaleX({progress})"></div>
            </div>
        </div>
    </HTML>
</Canvas>

<style>
    .bar {
        height: 6px;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.15);
        overflow: hidden;
    }

    .fill {
        width: 100%;
        height: 100%;
        background: #f4e3c0;
        transform-origin: left;
    }

    .box {
        display: flex;
        flex-direction: column;
        gap: 10px;
        align-items: center;
    }

    h1 {
        margin: 0px;
        font-family: "Newsreader Variable", monospace;
        margin-inline-end: -0.35em;
        font-size: 5rem;
        letter-spacing: 0.35em;
        color: white;
    }
</style>
