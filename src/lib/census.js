export const planets = [
    {
        id: 1,
        bodyName: "Rahhal",
        arBodyName: "الرحال",
        subType: "Venus-like world",
        semiMajorAxis: 0.75,
        eccentricity: 0.43,
        periAph: [0.43, 1.07],
        earthRadius: 0.95,
        axialTilt: 3,
        orbitalInclination: 15,
        orbitalPeriod: 208,
        phase: 43,
        T_eq: 370,
    },
    {
        id: 2,
        bodyName: "Ayn",
        arBodyName: "العين",
        subType: "Earth-like world",
        semiMajorAxis: 1.85,
        eccentricity: 0.03,
        periAph: [1.79, 1.91],
        earthRadius: 1.15,
        axialTilt: 23,
        orbitalInclination: 0,
        orbitalPeriod: 806,
        phase: 180,
        T_eq: 236,
    },
    {
        id: 3,
        bodyName: "Waddah",
        arBodyName: "وضاح",
        subType: "Class II gas giant",
        semiMajorAxis: 1.85,
        eccentricity: 0.03,
        periAph: [1.79, 1.91],
        earthRadius: 11.8,
        axialTilt: 34,
        orbitalInclination: 0,
        orbitalPeriod: 806,
        phase: 120,
        T_eq: 236,
    },
    {
        id: 4,
        bodyName: "Nafis",
        arBodyName: "النفيس",
        subType: "Titan-like world",
        semiMajorAxis: 3.65,
        eccentricity: 0.15,
        periAph: [3.1, 4.2],
        earthRadius: 0.3,
        axialTilt: 25,
        orbitalInclination: 3,
        orbitalPeriod: 2234,
        phase: 0,
        T_eq: 168,
    },
];

export const FASIL_MESH_RADIUS = 2;
export const KM_PER_SOLAR_RADIUS = 696340;
export const KM_PER_EARTH_RADIUS = 6371;
export const KM_PER_AU = 149597871;

export const star = {
    id: 0,
    bodyName: "Fasil",
    arBodyName: "الفاصل",
    subType: "F-Type Star",
    solarMass: 1.3,
    solarRadius: 1.27,
    luminosity: 2.5,
    habitableZone: [1.51, 2.17],
    T_eff: 6450,
};

export const FASIL_REAL_KM = star.solarRadius * KM_PER_SOLAR_RADIUS;
export const UNITS_PER_KM = FASIL_MESH_RADIUS / FASIL_REAL_KM;

export function auToUnits(au) {
    return au * KM_PER_AU * UNITS_PER_KM;
}

export function bodyRadiusUnits(body) {
    if (body.solarRadius) {
        return body.solarRadius * KM_PER_SOLAR_RADIUS * UNITS_PER_KM;
    } else {
        return body.earthRadius * KM_PER_EARTH_RADIUS * UNITS_PER_KM;
    }
}