<script>
    import { Canvas, T } from "@threlte/core";
    import { HTML } from "@threlte/extras";
    import { PlaneGeometry } from "three";

    let { progress = 0 } = $props();

    const ORBIT_R = 1.7;
    const TILT = 0.4;
    const TILT_Z = 3;
    const SPEED = 1.1;
    const BODY_R = 0.18;

    const BAR_W = 1;
    const BAR_H = 1.05;
    const barGeo = new PlaneGeometry(BAR_W, BAR_H);

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

<Canvas>
    <T.PerspectiveCamera makeDefault position={[0, 0, 5]} fov={45} />
    <T.PointLight position={[0, 0, 0]} intensity={10} />
    <T.AmbientLight intensity={0.15} />

    <T.Group rotation.x={TILT} rotation.z={TILT_Z}>
        <T.Group rotation.y={angle}>
            <T.Mesh position={[ORBIT_R, 0, 0]}>
                <T.SphereGeometry args={[BODY_R, 32, 16]} />
                <T.MeshStandardMaterial color="#f4f0e6" roughness={0.55} />
            </T.Mesh>
        </T.Group>
    </T.Group>

    <HTML occlude="blending" geometry={barGeo} center>
        <div class="box">
            <h1 class="title">fsa.sa</h1>
            <div class="bar">
                <div class="fill" style:transform="scaleX({progress})"></div>
            </div>
        </div>
    </HTML>
</Canvas>

<style>
    .bar {
        width: 460px;
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
