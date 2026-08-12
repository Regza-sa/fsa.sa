<script>
    import { planets, bodyRadiusUnits } from "$lib/census";
    import { T } from "@threlte/core";
    import { TextureLoader, SRGBColorSpace, Vector3, DoubleSide } from "three";
    import Atmosphere from "./Atmosphere.svelte";

    let { output, waddahPosition } = $props();

    const WADDAH = planets.find((p) => p.id === 3);
    const AXIAL_TILT = (WADDAH.axialTilt * Math.PI) / 180;
    const ATMO_RP = bodyRadiusUnits(WADDAH);
    const ATMO_COLOR = "#d1d0e7";
    const RING_INNER = ATMO_RP * 2.207;
    const RING_OUTER = ATMO_RP * 3.273;

    const RING_VERT = `
        varying vec2 vUv;
        varying vec3 vPosV;
        varying vec3 vNormalV;
        varying vec3 vCenterV;
        void main() {
            vUv = uv;
            vec4 viewPos = modelViewMatrix * vec4(position, 1.0);
            vPosV = viewPos.xyz;
            vNormalV = normalize(normalMatrix * normal);
            vCenterV = (modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
            gl_Position = projectionMatrix * viewPos;
        }
    `;

    const RING_FRAG = `
        uniform sampler2D uMap;
        uniform vec3 uStarPos;
        uniform float uPlanetRadius;
        uniform float uOpacity;
        varying vec2 vUv;
        varying vec3 vPosV;
        varying vec3 vNormalV;
        varying vec3 vCenterV;
        void main() {
            vec4 tex = texture2D(uMap, vUv);

            vec3 starV = (viewMatrix * vec4(uStarPos, 1.0)).xyz;
            vec3 L = normalize(starV - vPosV);
            float lit = abs(dot(normalize(vNormalV), L));

            vec3 oc = vCenterV - vPosV;
            float tca = dot(oc, L);
            float b2 = dot(oc, oc) - tca * tca;
            float shadow = 1.0;
            if (tca > 0.0) {
                shadow = smoothstep(uPlanetRadius * 0.98, uPlanetRadius * 1.06, sqrt(b2));
            }

            gl_FragColor = vec4(tex.rgb * lit * shadow, tex.a * uOpacity);
            #include <colorspace_fragment>
        }
    `;

    const RING_UNIFORMS = {
        uMap: { value: null },
        uStarPos: { value: new Vector3(0, 0, 0) },
        uPlanetRadius: { value: ATMO_RP },
        uOpacity: { value: 0.5 },
    };

    let waddahMap = $state(null);
    let waddahMat = $state(null);

    new TextureLoader().load("/textures/waddah_ring.png", (tex) => {
        tex.colorSpace = SRGBColorSpace;
        RING_UNIFORMS.uMap.value = tex;
    });

    new TextureLoader().load("/textures/waddah_color.jpg", (tex) => {
        tex.colorSpace = SRGBColorSpace;
        waddahMap = tex;
    });

    $effect(() => {
        if (waddahMat && waddahMap) {
            waddahMat.map = waddahMap;
            waddahMat.needsUpdate = true;
        }
    });
</script>

<T.Group
    position={[waddahPosition.x, waddahPosition.y, waddahPosition.z]}
    rotation={[0, 0, AXIAL_TILT]}
>
    <T.Mesh oncreate={(mesh) => output(mesh)}>
        <T.SphereGeometry args={[ATMO_RP, 64, 32]} />
        <T.MeshStandardMaterial
            oncreate={(mat) => {
                waddahMat = mat;
            }}
            map={waddahMap}
            color={"#ffffff"}
            roughness={1}
            metalness={0}
        />
    </T.Mesh>

    <!--atmosphere-->
    <Atmosphere
        planetRadius={ATMO_RP}
        color={ATMO_COLOR}
        scale={1.04}
        shellOpacity={0.2}
    />

    <!--rings-->
    <T.Mesh rotation={[-Math.PI / 2, 0, 0]}>
        <T.RingGeometry
            args={[RING_INNER, RING_OUTER, 128, 4]}
            oncreate={(geometry) => {
                const pos = geometry.attributes.position;
                const uv = geometry.attributes.uv;
                for (let i = 0; i < pos.count; i++) {
                    const x = pos.getX(i);
                    const y = pos.getY(i);
                    const r = Math.sqrt(x * x + y * y);
                    uv.setXY(
                        i,
                        (r - RING_INNER) / (RING_OUTER - RING_INNER),
                        0.5,
                    );
                    uv.needsUpdate = true;
                }
            }}
        />
        <T.ShaderMaterial
            args={[
                {
                    uniforms: RING_UNIFORMS,
                    vertexShader: RING_VERT,
                    fragmentShader: RING_FRAG,
                    transparent: true,
                    depthWrite: false,
                    side: DoubleSide,
                },
            ]}
        />
    </T.Mesh>
</T.Group>
