<script>
    import { planets, bodyRadiusUnits } from "$lib/census";
    import { T } from "@threlte/core";
    import { TextureLoader, SRGBColorSpace, Vector3, DoubleSide } from "three";
    import Atmosphere from "./Atmosphere.svelte";

    let { output, rahhalPosition } = $props();

    const RAHHAL = planets.find((p) => p.id === 1);
    const AXIAL_TILT = (RAHHAL.axialTilt * Math.PI) / 180;
    const ATMO_RP = bodyRadiusUnits(RAHHAL);
    const CLOUD_SCALE = 1.0089;
    const ATMO_SCALE = 1.0366;
    const ATMO_COLOR = "#e7bc84";
    const cloud_radius = ATMO_RP * CLOUD_SCALE;

    const RING_INNER = ATMO_RP * 1.4533;
    const RING_OUTER = ATMO_RP * 3.0119;

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
            float lit = mix(0.30, 1.0, abs(dot(normalize(vNormalV), L)));

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
        uOpacity: { value: 0.8 },
    };

    let rahhalMap = $state(null);
    let rahhalMat = $state(null);

    let cloudMap = $state(null);
    let cloudMat = $state(null);

    new TextureLoader().load("/textures/rahhal_ring.png", (tex) => {
        tex.colorSpace = SRGBColorSpace;
        RING_UNIFORMS.uMap.value = tex;
    });

    new TextureLoader().load("/textures/rahhal_clouds.png", (tex) => {
        tex.colorSpace = SRGBColorSpace;
        cloudMap = tex;
    });

    new TextureLoader().load("/textures/rahhal_color.jpg", (tex) => {
        tex.colorSpace = SRGBColorSpace;
        rahhalMap = tex;
    });

    $effect(() => {
        if (rahhalMap && rahhalMat) {
            rahhalMat.map = rahhalMap;
            rahhalMat.needsUpdate = true;
        }
        if (cloudMap && cloudMat) {
            cloudMat.map = cloudMap;
            cloudMat.needsUpdate = true;
        }
    });
</script>

<T.Group
    position={[rahhalPosition.x, 0, rahhalPosition.z]}
    rotation={[0, 0, AXIAL_TILT]}
>
    <T.Mesh oncreate={(mesh) => output(mesh)}>
        <T.SphereGeometry args={[ATMO_RP, 64, 32]} />
        <T.MeshStandardMaterial
            oncreate={(mat) => {
                rahhalMat = mat;
            }}
            map={rahhalMap}
            color={"#ffffff"}
            roughness={1}
            metalness={0}
        />
    </T.Mesh>
    <!--clouds-->
    <T.Mesh>
        <T.SphereGeometry args={[cloud_radius, 64, 32]} />
        <T.MeshStandardMaterial
            oncreate={(mat) => {
                cloudMat = mat;
            }}
            map={cloudMap}
            color="#ffffff"
            transparent={true}
            opacity={0.5}
            depthWrite={false}
        />
    </T.Mesh>
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

    <!--atmosphere-->
    <Atmosphere
        planetRadius={ATMO_RP}
        color={ATMO_COLOR}
        scale={ATMO_SCALE}
        shellOpacity={0.15}
    />
</T.Group>
