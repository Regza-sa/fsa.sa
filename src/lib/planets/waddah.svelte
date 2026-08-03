<script>
    import { planets, bodyRadiusUnits } from "$lib/census";
    import { T, useThrelte } from "@threlte/core";
    import {
        BufferGeometry,
        Vector3,
        TextureLoader,
        EquirectangularReflectionMapping,
        SRGBColorSpace,
        AdditiveBlending,
        Color,
        Mesh,
        DoubleSide,
    } from "three";

    let { output, waddahPosition } = $props();

    const { scene } = useThrelte();
    const WADDAH = planets.find((p) => p.id === 3);
    const AXIAL_TILT = (WADDAH.axialTilt * Math.PI) / 180;
    const ATMO_SCALE = 1.04;
    const ATMO_OFFSET = 1.01;
    const ATMO_COLOR = "#d6eeff";
    const ATMO_RP = bodyRadiusUnits(WADDAH);
    const ATMO_OF = ATMO_RP * ATMO_OFFSET;
    const ATMO_RA = ATMO_RP * ATMO_SCALE;
    const RING_INNER = ATMO_RP * 2.207;
    const RING_OUTER = ATMO_RP * 3.273;

    const ATMO_VERT = `
        varying vec3 vPosW;
        varying vec3 vCenter;
        void main() {
            vec4 world = modelMatrix * vec4(position, 1.0);
            vPosW = world.xyz;
            vCenter = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
            gl_Position = projectionMatrix * viewMatrix * world;
        }
    `;

    const ATMO_FRAG = `
        uniform vec3 uColor;
        uniform vec3 uStarPos;
        uniform float uRp;
        uniform float uRa;
        uniform float uDensity;
        uniform float uIntensity;
        varying vec3 vPosW;
        varying vec3 vCenter;
        void main() {
            vec3 ro = cameraPosition;
            vec3 rd = normalize(vPosW - ro);
            vec3 oc = vCenter - ro;
            float tca = dot(oc, rd);
            float b2 = dot(oc, oc) - tca * tca;
            float ra2 = uRa * uRa;
            if (b2 >= ra2) discard;
            float rp2 = uRp * uRp;
            float outer = sqrt(ra2 - b2);
            float L = (b2 < rp2) ? (outer - sqrt(rp2 - b2)) : (2.0 * outer);
            float alpha = 1.0 - exp(-(L / uRp) * uDensity);
            vec3 near = ro + rd * tca;
            vec3 nrm = normalize(near - vCenter);
            float lit = smoothstep(-0.30, 0.30, dot(nrm, normalize(uStarPos - near)));
            gl_FragColor = vec4(uColor * uIntensity * alpha * lit, alpha * lit);
        }
    `;

    const ATMO_UNIFORMS = {
        uColor: { value: new Color(0.6396, 0.6304, 0.8008) },
        uStarPos: { value: new Vector3(0, 0, 0) },
        uRp: { value: ATMO_RP },
        uRa: { value: ATMO_RA },
        uDensity: { value: 1.5 },
        uIntensity: { value: 1.15 },
    };

    const RING_VERT = `
        varying vec2 vUv;
        varying vec3 vPosW;
        varying vec3 vNormalW;
        varying vec3 vCenter;
        void main() {
            vUv = uv;
            vec4 world = modelMatrix * vec4(position, 1.0);
            vPosW = world.xyz;
            vNormalW = normalize(mat3(modelMatrix) * normal);
            vCenter = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
            gl_Position = projectionMatrix * viewMatrix * world;
        }
    `;

    const RING_FRAG = `
        uniform sampler2D uMap;
        uniform vec3 uStarPos;
        uniform float uPlanetRadius;
        uniform float uOpacity;
        varying vec2 vUv;
        varying vec3 vPosW;
        varying vec3 vNormalW;
        varying vec3 vCenter;
        void main() {
            vec4 tex = texture2D(uMap, vUv);

            vec3 L = normalize(uStarPos - vPosW);
            float lit = abs(dot(normalize(vNormalW), L));

            vec3 oc = vCenter - vPosW;
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

    let ringMap = $state(null);

    new TextureLoader().load("/textures/waddah_ring.png", (tex) => {
        tex.colorSpace = SRGBColorSpace;
        RING_UNIFORMS.uMap.value = tex;
        ringMap = tex;
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
    position={[waddahPosition.x, 0, waddahPosition.z]}
    rotation={[0, 0, AXIAL_TILT]}
>
    <T.Mesh oncreate={(mesh) => output(mesh)}>
        <T.SphereGeometry args={[bodyRadiusUnits(WADDAH), 64, 32]} />
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
    <!--atmosphere ball-->
    <T.Mesh>
        <T.SphereGeometry args={[ATMO_OF, 64, 32]} />
        <T.MeshStandardMaterial
            color={ATMO_UNIFORMS.uColor}
            transparent={true}
            opacity={0.2}
            depthWrite={false}
        />
    </T.Mesh>
    <!--atmosphere effect-->
    <T.Mesh>
        <T.SphereGeometry args={[ATMO_RA, 64, 32]} />
        <T.ShaderMaterial
            args={[
                {
                    uniforms: ATMO_UNIFORMS,
                    vertexShader: ATMO_VERT,
                    fragmentShader: ATMO_FRAG,
                    transparent: true,
                    depthWrite: false,
                    blending: AdditiveBlending,
                },
            ]}
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
</T.Group>
