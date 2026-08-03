<script>
    let { lang } = $props();
    import {
        waddahAudio,
        aynAudio,
        nafisAudio,
        rahhalAudio,
    } from "./assets/planetaudio";
    import {
        planets,
        star,
        FASIL_MESH_RADIUS,
        auToUnits,
        bodyRadiusUnits,
    } from "$lib/census";
    import Waddah from "$lib/planets/waddah.svelte";
    import Ayn from "$lib/planets/ayn.svelte";
    import { waddahIcon, aynIcon } from "$lib/assets/planeticons";
    import { T, useTask, useThrelte } from "@threlte/core";
    import { OrbitControls, HTML } from "@threlte/extras";
    import {
        BufferGeometry,
        Vector3,
        TextureLoader,
        EquirectangularReflectionMapping,
        SRGBColorSpace,
        AdditiveBlending,
        Color,
    } from "three";
    import { Tween } from "svelte/motion";
    import { cubicInOut } from "svelte/easing";
    const { scene } = useThrelte();
    const bodies = [star, ...planets];

    new TextureLoader().load("/textures/starmap.jpg", (tex) => {
        tex.mapping = EquirectangularReflectionMapping;
        tex.colorSpace = SRGBColorSpace;
        scene.background = tex;
    });

    let activeBody = $state(0);
    let controls = $state();
    let meshes = $state({});

    const flight = new Tween(1, { duration: 3000, easing: cubicInOut });
    const flightFrom = new Vector3();

    let distLogFrom = 0;
    let distLogTo = 0;

    async function flyTo(id) {
        if (id === activeBody) {
            return;
        }

        flightFrom.copy(controls.target);

        meshes[id].getWorldPosition(spot);
        distLogFrom = Math.log(controls.object.position.distanceTo(spot));
        distLogTo = Math.log(bodyRadiusUnits(bodies[id]) * 5);

        activeBody = id;
        controls.enabled = false;
        dir.subVectors(controls.object.position, spot).normalize();

        if (audioEls[id]) {
            audioEls[id].load();
        }

        await flight.set(0, { duration: 0 });
        await flight.set(1);

        controls.enabled = true;
    }

    let planetsWithGeometry = $derived(
        planets.map((planet) => {
            const points = calculateOrbitPoints(
                planet.semiMajorAxis,
                planet.eccentricity,
                128,
            );
            const geometry = new BufferGeometry().setFromPoints(points);
            return { ...planet, geometry };
        }),
    );

    function calculateOrbitPoints(a, e, cnt = 100) {
        const points = [];
        const step = (Math.PI * 2) / cnt;

        for (let theta = 0; theta < Math.PI * 2 + step; theta += step) {
            const sceneAU = auToUnits(a);
            const { x, z } = smaEccentricityCalc(sceneAU, e, theta);
            points.push(new Vector3(x, 0, z));
        }

        return points;
    }

    function smaEccentricityCalc(a, e, theta) {
        let sminora = a * Math.sqrt(1 - e * e);
        let focal = a * e;
        let x = a * Math.cos(theta) - focal;
        let z = sminora * Math.sin(theta);

        return { x, z };
    }

    function orbitAngle(planet) {
        const speed = (Math.PI * 2) / (planet.orbitalPeriod * 86400);
        return rad(planet.phase) + elapsed * speed;
    }

    function rad(deg) {
        return (deg * Math.PI) / 180;
    }

    function soiUnits(body) {
        return bodyRadiusUnits(body) * 100;
    }

    function languageCheck() {
        let language = false;
        if (lang.includes("-")) {
            let code = lang.split("-", 1)[0];
            if (code == "ar") {
                language = true;
                console.log("has arabic");
            }
            console.log("nope arabic");
        } else {
            language = lang.includes("ar");
        }
        return language;
    }

    const EPOCH = Date.UTC(2026, 0, 1);
    let elapsed = $state((Date.now() - EPOCH) / 1000);

    let spot = new Vector3();
    let dir = new Vector3();

    let lineOpacity = $state(0.5);
    let sphereOpacity = $state(1);
    let arabic = $state(languageCheck());

    const SUNLIGHT_AT_1AU = 2;
    const AU_UNITS = auToUnits(1);
    const starIntensity =
        star.luminosity * SUNLIGHT_AT_1AU * AU_UNITS * AU_UNITS;

    // audio system

    const audioSrc = {
        1: rahhalAudio,
        2: aynAudio,
        3: waddahAudio,
        4: nafisAudio,
    };
    const audioVolume = { 1: 0.2, 2: 0.4, 3: 0.15, 4: 0.4 };
    const audioSeek = { 1: 0.5, 2: 2, 3: 0.5, 4: 0.5 };

    let audioEls = $state([]);
    let playing = $state(-1); // bodyid
    let called = false;

    function audioInit() {
        called = true;
        for (let i = 0; i < planets.length; i++) {
            const audio = audioEls[planets[i].id];
            audio.loop = true;
            audio.volume = 0;
        }
    }

    function seek(seconds, audio) {
        if (audio.readyState >= 1) {
            audio.currentTime = seconds;
        } else {
            audio.addEventListener(
                "loadedmetadata",
                () => (audio.currentTime = seconds),
                { once: true },
            );
        }
    }

    function playAudio(bodyId) {
        const audio = audioEls[bodyId];
        if (!audio) return;
        audio.volume = audioVolume[bodyId] ?? 0.3;
        seek(audioSeek[bodyId] ?? 0, audio);
        audio.play().catch((e) => console.log("blocked:", e.name));
    }

    useTask((delta) => {
        elapsed += delta;

        if (Object.keys(audioEls).length == planets.length && !called) {
            audioInit();
        }

        const body = bodies[activeBody];
        const mesh = meshes[activeBody];
        let targetOpacity = 0.5;
        let sphereTargetOpacity = 1;
        let targetVolume = 0;
        if (controls && controls.getDistance() < soiUnits(body)) {
            targetOpacity = 0;
            sphereTargetOpacity = 0;

            if (playing == -1 && called) {
                playing = activeBody;
                playAudio(activeBody);
            }

            for (let i = 0; i < planets.length; i++) {
                const id = planets[i].id;
                if (id != playing) {
                    let audio = audioEls[planets[i].id];
                    audio.volume +=
                        (targetVolume - audio.volume) * Math.min(1, delta * 3);
                }
            }
        } else {
            playing = -1;
            if (called) {
                for (let i = 0; i < planets.length; i++) {
                    let audio = audioEls[planets[i].id];
                    audio.volume +=
                        (targetVolume - audio.volume) * Math.min(1, delta * 3);
                }
            }
        }
        lineOpacity += (targetOpacity - lineOpacity) * Math.min(1, delta * 5);
        sphereOpacity +=
            (sphereTargetOpacity - sphereOpacity) * Math.min(1, delta * 5);
        scene.backgroundIntensity = lineOpacity * 2;
        if (controls && mesh && body) {
            mesh.getWorldPosition(spot);
            if (flight.current < 1) {
                const t = flight.current;
                const ZOOM_START = 0.4;
                const tPan = Math.min(t / 0.4, 1);
                const tZoom = Math.max((t - ZOOM_START) / (1 - ZOOM_START), 0);

                controls.target.copy(flightFrom).lerp(spot, tPan);

                const dist = Math.exp(
                    distLogFrom + (distLogTo - distLogFrom) * tZoom,
                );
                controls.object.position.copy(spot).addScaledVector(dir, dist);
            } else {
                controls.target.copy(spot);
            }
            controls.minDistance = bodyRadiusUnits(body) * 1.5;
        }
    });
</script>

<T.PerspectiveCamera
    makeDefault
    position={[0, 400, 900]}
    near={0.001}
    far={10000}
>
    <OrbitControls
        bind:ref={controls}
        enableDamping
        dampingFactor={0.08}
        zoomSpeed={10}
        minDistance={0.01}
        maxDistance={6000}
    />
</T.PerspectiveCamera>

<T.PointLight intensity={starIntensity} />

<!-- Fasil mesh-->
<T.Mesh oncreate={(mesh) => (meshes[star.id] = mesh)}>
    <T.SphereGeometry args={[FASIL_MESH_RADIUS, 32, 32]} />
    <T.MeshBasicMaterial color="#ffcc66" />
</T.Mesh>

<!-- planets -->
{#each planets as body}
    {@const angle = orbitAngle(body)}
    {@const pos = smaEccentricityCalc(
        auToUnits(body.semiMajorAxis),
        body.eccentricity,
        angle,
    )}
    {@const active = activeBody === body.id}

    <audio
        bind:this={audioEls[body.id]}
        src={audioSrc[body.id]}
        preload="none"
        loop
    ></audio>

    {#if body.id !== 3 && body.id !== 2}
        <T.Mesh
            position={[pos.x, 0, pos.z]}
            oncreate={(mesh) => (meshes[body.id] = mesh)}
        >
            <T.SphereGeometry args={[bodyRadiusUnits(body), 64, 32]} />
            <T.MeshStandardMaterial color="teal" roughness={1} metalness={0} />
        </T.Mesh>
    {:else if body.id === 3}
        <Waddah output={(x) => (meshes[body.id] = x)} waddahPosition={pos} />
    {:else if body.id === 2}
        <Ayn output={(x) => (meshes[body.id] = x)} aynPosition={pos} />
    {/if}

    <!--selection sphere-->
    <HTML position={[pos.x, 0, pos.z]} center>
        <button
            class="marker"
            class:selected={active}
            onclick={() => {
                if (!active || lineOpacity > 0.03) {
                    flyTo(body.id);
                }
            }}
            onpointerdowncapture={(e) => e.stopPropagation()}
        >
            {#if body.id !== 3 && body.id !== 2}
                <span class="ring" style:opacity={active ? sphereOpacity : null}
                ></span>
            {:else if body.id === 3}
                <img
                    class="icon"
                    src={waddahIcon}
                    style:opacity={active ? sphereOpacity : null}
                    alt="Waddah icon"
                />
            {:else if body.id === 2}
                <img
                    class="icon"
                    src={aynIcon}
                    style:opacity={active ? sphereOpacity : null}
                    alt="Waddah icon"
                />
            {/if}
            {#if arabic}
                <span
                    class="nameAr"
                    style:opacity={active ? sphereOpacity : null}
                    >{body.arBodyName}</span
                >
            {:else}
                <span class="name" style:opacity={active ? sphereOpacity : null}
                    >{body.bodyName}</span
                >
            {/if}
        </button>
    </HTML>
{/each}

<!--orbit lines-->
{#each planetsWithGeometry as planetData}
    <T.LineLoop
        geometry={planetData.geometry}
        oncreate={(line) => line.computeLineDistances()}
    >
        <T.LineDashedMaterial
            color={planetData.orbitLineColor ?? "#999999"}
            opacity={lineOpacity}
            transparent={true}
            dashSize={1}
            gapSize={1}
        />
    </T.LineLoop>
{/each}

<style>
    .marker {
        position: relative;
        background: none;
        border: none;
        padding: 0;
        cursor: pointer;
        pointer-events: auto;
    }
    .selected {
        pointer-events: none;
    }
    .ring {
        display: block;
        width: 18px;
        height: 18px;
        border: 1.5px solid rgba(136, 204, 255, 0.8);
        border-radius: 50%;
    }
    .icon {
        display: block;
        width: 36px;
        height: 36px;
    }
    .name {
        position: absolute;
        left: 32px;
        top: 50%;
        transform: translateY(-70%);
        font-family: "IBM Plex Mono", monospace;
        letter-spacing: 0.35em;
        color: rgba(255, 255, 255, 0.85);
        text-transform: uppercase;
    }
    .nameAr {
        position: absolute;
        right: 32px; /*every planet eventually will have icons.*/
        top: 50%;
        transform: translateY(-50%);
        font-family: "IBM Plex Sans Arabic", sans-serif;
        font-weight: 500;
        direction: rtl;
        font-size: 13px;
        color: rgb(255, 255, 255);
        white-space: nowrap;
    }
</style>
