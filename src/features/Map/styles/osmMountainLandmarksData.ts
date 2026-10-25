/**
 * @file osmMountainLandmarksData.ts
 * @description Offline OpenStreetMap (OSM) GeoJSON dataset containing detailed mountain
 * landmarks (campsites, numbered sub-peaks, elevations, trailheads, kubo rest stops,
 * viewpoints, waterfalls, springs, rock formations) and nearby emergency hospitals/clinics
 * for the 5 supported mountains (Mt. Batulao, Mt. Kulis, Mt. Daraitan, Mt. Tagapo, Mt. Sembrano).
 *
 * This supplements the z14 Protomaps PMTiles basemap where Planetiler's default zoom-14
 * label-grid pruning omits closely-spaced trail camps (e.g. Mt. Batulao Camps 1–9 & Peaks 1–11)
 * and peak elevation tags (`ele`).
 */

export interface IOsmLandmarkProperties {
    id: string;
    name: string;
    /** Category used by offlineStyle.ts symbol/circle layers */
    category:
        | "summit"
        | "sub_peak"
        | "camp_site"
        | "trailhead"
        | "kubo"
        | "viewpoint"
        | "waterfall"
        | "water_source"
        | "landmark"
        | "toilets"
        | "hospital"
        | "clinic";
    /** Elevation in meters above sea level (MASL) from OSM `ele` tag */
    ele?: string;
    mountainId?: "batulao" | "kulis" | "daraitan" | "tagapo" | "sembrano";
    note?: string;
    phone?: string;
}

export interface IOsmLandmarkFeature {
    type: "Feature";
    properties: IOsmLandmarkProperties;
    geometry: {
        type: "Point";
        coordinates: [number, number]; // [lon, lat]
    };
}

export interface IOsmLandmarkFeatureCollection {
    type: "FeatureCollection";
    features: IOsmLandmarkFeature[];
}

function pt(
    id: string,
    lon: number,
    lat: number,
    name: string,
    category: IOsmLandmarkProperties["category"],
    extra?: Partial<Omit<IOsmLandmarkProperties, "id" | "name" | "category">>,
): IOsmLandmarkFeature {
    return {
        type: "Feature",
        properties: {
            id,
            name,
            category,
            ...extra,
        },
        geometry: {
            type: "Point",
            coordinates: [lon, lat],
        },
    };
}

/**
 * Curated, OSM-verified point features (OSM API v0.6 node/way coordinates)
 * for detailed offline mountain rendering and emergency hospital awareness.
 */
export const OSM_MOUNTAIN_LANDMARKS_GEOJSON: IOsmLandmarkFeatureCollection = {
    type: "FeatureCollection",
    features: [
        // ═══════════════════════════════════════════════════════════════════
        // 1. MT. BATULAO (Nasugbu / Calaca / Balayan, Batangas)
        // ═══════════════════════════════════════════════════════════════════
        // Main Summit & Adjacent Caldera Peak
        pt("osm-node-332020556", 120.8023782, 14.0399434, "Mount Batulao", "summit", {
            ele: "811",
            mountainId: "batulao",
        }),
        pt("osm-node-319588242", 120.7908352, 14.0491353, "Mt. Toong", "summit", {
            ele: "693",
            mountainId: "batulao",
        }),

        // Trailheads / Jump-offs
        pt("osm-node-661099448", 120.8205722, 14.0554825, "Batulao Jump-off", "trailhead", {
            ele: "599",
            mountainId: "batulao",
        }),
        pt("osm-node-5537284461", 120.7837263, 14.0257456, "Batulao - Tuy Jump-off", "trailhead", {
            mountainId: "batulao",
        }),

        // Old Trail Campsites (Camps 1 to 9)
        pt("osm-node-662722021", 120.8071103, 14.0435188, "Camp 1", "camp_site", {
            ele: "576",
            mountainId: "batulao",
            note: "Registration & Fee Station (PHP 20)",
        }),
        pt("osm-node-662722018", 120.806624, 14.043034, "Camp 2", "camp_site", {
            ele: "591",
            mountainId: "batulao",
        }),
        pt("osm-node-662722020", 120.806395, 14.042653, "Camp 3", "camp_site", {
            ele: "599",
            mountainId: "batulao",
        }),
        pt("osm-node-662722019", 120.806266, 14.042089, "Camp 4", "camp_site", {
            ele: "613",
            mountainId: "batulao",
        }),
        pt("osm-node-662722016", 120.8060562, 14.0415275, "Camp 5", "camp_site", {
            ele: "635",
            mountainId: "batulao",
        }),
        pt("osm-node-662722017", 120.8059459, 14.0413065, "Camp 6", "camp_site", {
            ele: "645",
            mountainId: "batulao",
        }),
        pt("osm-node-662722008", 120.804901, 14.04066, "Camp 7", "camp_site", {
            ele: "678",
            mountainId: "batulao",
        }),
        pt("osm-node-662722007", 120.8035496, 14.040996, "Camp 8", "camp_site", {
            ele: "753",
            mountainId: "batulao",
        }),
        pt("osm-node-662722006", 120.8028537, 14.0406284, "Camp 9", "camp_site", {
            ele: "786",
            mountainId: "batulao",
        }),

        // New Trail Numbered Peaks (Peaks 1 to 11)
        pt("osm-node-662722025", 120.806506, 14.051085, "Peak 1", "sub_peak", {
            ele: "645",
            mountainId: "batulao",
        }),
        pt("osm-node-662722024", 120.8059324, 14.0502407, "Peak 2", "sub_peak", {
            ele: "663",
            mountainId: "batulao",
        }),
        pt("osm-node-662722015", 120.8053011, 14.049193, "Peak 3", "sub_peak", {
            ele: "661",
            mountainId: "batulao",
        }),
        pt("osm-node-662722014", 120.8049197, 14.0483638, "Peak 4", "sub_peak", {
            ele: "675",
            mountainId: "batulao",
        }),
        pt("osm-node-662722013", 120.8046225, 14.0475308, "Peak 5", "sub_peak", {
            ele: "683",
            mountainId: "batulao",
        }),
        pt("osm-node-662722011", 120.803778, 14.046925, "Peak 6", "sub_peak", {
            ele: "694",
            mountainId: "batulao",
        }),
        pt("osm-node-662722012", 120.8034153, 14.046112, "Peak 7", "sub_peak", {
            ele: "701",
            mountainId: "batulao",
        }),
        pt("osm-node-662722010", 120.802709, 14.0455111, "Peak 8", "sub_peak", {
            ele: "686",
            mountainId: "batulao",
            note: "New Trail Registration & Campsite",
        }),
        pt("osm-node-662722009", 120.8016275, 14.0433893, "Peak 9", "sub_peak", {
            ele: "718",
            mountainId: "batulao",
        }),
        pt("osm-node-1995657736", 120.8011879, 14.0412851, "Peak 10", "sub_peak", {
            ele: "753",
            mountainId: "batulao",
        }),
        pt("osm-node-1995657739", 120.8014709, 14.0406309, "Peak 11", "sub_peak", {
            ele: "761",
            mountainId: "batulao",
        }),

        // Batulao Rest Stops (Kubo), Technical Points & Facilities
        pt("osm-node-662722027", 120.8096881, 14.0520189, "Kubo 1", "kubo", {
            ele: "650",
            mountainId: "batulao",
        }),
        pt("osm-node-662722026", 120.8068147, 14.0513739, "Kubo 2 (Old/New Fork)", "kubo", {
            ele: "632",
            mountainId: "batulao",
        }),
        pt("osm-node-662722023", 120.807252, 14.04748, "Kubo 3", "kubo", {
            mountainId: "batulao",
        }),
        pt("osm-node-662722022", 120.8066932, 14.0455776, "Kubo 4", "kubo", {
            mountainId: "batulao",
        }),
        pt("osm-node-2005523920", 120.8025741, 14.0403315, "Rappel Point", "landmark", {
            ele: "807",
            mountainId: "batulao",
        }),
        pt("osm-node-3042655991", 120.8034408, 14.0409526, "Biak na Bato", "landmark", {
            ele: "754",
            mountainId: "batulao",
        }),
        pt("osm-node-3042655992", 120.8079189, 14.0439882, "Water Spring", "water_source", {
            ele: "561",
            mountainId: "batulao",
        }),
        pt("osm-node-1995658193", 120.8068186, 14.0433788, "Camp 1 Restroom", "toilets", {
            mountainId: "batulao",
        }),

        // ═══════════════════════════════════════════════════════════════════
        // 2. MT. KULIS (Brgy. Cuyambay, Tanay, Rizal)
        // ═══════════════════════════════════════════════════════════════════
        pt("osm-node-8258769217", 121.3669223, 14.6082521, "Mount Kulis", "summit", {
            ele: "620",
            mountainId: "kulis",
        }),
        pt("osm-node-8258769317", 121.368594, 14.6089637, "Sambong Peak", "summit", {
            ele: "629",
            mountainId: "kulis",
        }),
        pt("osm-node-10181739012", 121.372793, 14.6102413, "Tangwa Peak", "sub_peak", {
            ele: "625",
            mountainId: "kulis",
        }),
        pt("osm-node-10181732720", 121.3770705, 14.6128252, "Lubo Peak", "sub_peak", {
            ele: "488",
            mountainId: "kulis",
        }),
        pt("osm-node-10252450796", 121.3791096, 14.6138898, "2nd Peak, Mt. Lubo", "viewpoint", {
            mountainId: "kulis",
        }),
        pt("osm-node-5458336221", 121.3654635, 14.5989628, "Treasure Mountain", "viewpoint", {
            ele: "502",
            mountainId: "kulis",
        }),
        pt("osm-node-10181751839", 121.3727123, 14.609094, "Ngusong Kabayo Rock", "landmark", {
            ele: "602",
            mountainId: "kulis",
        }),
        pt("osm-node-8251099317", 121.3646257, 14.6049112, "Fresno Eco-Tourism Campsite (Jump-off)", "trailhead", {
            mountainId: "kulis",
        }),
        pt("osm-node-5539147430", 121.36449, 14.6006799, "Treasure Mountain Campsite", "camp_site", {
            mountainId: "kulis",
        }),
        pt("osm-node-10280330068", 121.3630097, 14.6148279, "Mt. Mahimbing Camp 1", "camp_site", {
            mountainId: "kulis",
        }),
        pt("osm-node-10280330040", 121.3650857, 14.6171197, "Mt. Mahimbing Camp 2", "camp_site", {
            mountainId: "kulis",
        }),
        pt("osm-node-10252469618", 121.3742542, 14.6111108, "Trail Shelter Hut", "kubo", {
            mountainId: "kulis",
        }),
        pt("osm-node-10181732759", 121.3781114, 14.6193055, "Tagpuan Falls (Laiban Falls)", "waterfall", {
            mountainId: "kulis",
        }),
        pt("osm-node-10181732762", 121.3774751, 14.620184, "Panat-in Falls", "waterfall", {
            mountainId: "kulis",
        }),
        pt("osm-node-10181756756", 121.3822103, 14.6263515, "Kalaparan Falls", "waterfall", {
            mountainId: "kulis",
        }),

        // ═══════════════════════════════════════════════════════════════════
        // 3. MT. DARAITAN (Brgy. Daraitan, Tanay, Rizal)
        // ═══════════════════════════════════════════════════════════════════
        pt("osm-node-12864070795", 121.4388102, 14.6132358, "Mount Daraitan Summit", "summit", {
            ele: "739",
            mountainId: "daraitan",
        }),
        pt("osm-node-332021138", 121.4379731, 14.6161523, "Mount Daraitan North Peak", "sub_peak", {
            ele: "719",
            mountainId: "daraitan",
        }),
        pt("osm-node-4468090590", 121.4422161, 14.6044275, "Tinipak River Rock Formation", "landmark", {
            mountainId: "daraitan",
        }),
        pt("osm-node-10177449733", 121.4292995, 14.6040119, "Brgy. Daraitan Hall (Jump-off)", "trailhead", {
            mountainId: "daraitan",
        }),
        pt("osm-node-6426898385", 121.4271829, 14.5995768, "The Private Camp: Daraitan", "camp_site", {
            mountainId: "daraitan",
        }),
        pt("osm-node-8539710217", 121.4271205, 14.597498, "Camp Tabing Ilog", "camp_site", {
            mountainId: "daraitan",
        }),
        pt("osm-node-13027784124", 121.4265016, 14.6033106, "Camp Daloy", "camp_site", {
            mountainId: "daraitan",
        }),
        pt("osm-node-13027784132", 121.4271594, 14.5995022, "SJ2 Camp Daraitan", "camp_site", {
            mountainId: "daraitan",
        }),
        pt("osm-node-13027905886", 121.42573, 14.60537, "Camp Gizing", "camp_site", {
            mountainId: "daraitan",
        }),
        pt("osm-node-12864070751", 121.4321502, 14.612394, "Kuta Bungliw Eco Lodge", "kubo", {
            mountainId: "daraitan",
        }),
        pt("osm-node-3766721338", 121.4640229, 14.6111802, "Sabangan Falls", "waterfall", {
            mountainId: "daraitan",
        }),
        pt("osm-node-5353867713", 121.4494461, 14.5694436, "Kunapat Falls", "waterfall", {
            mountainId: "daraitan",
        }),

        // ═══════════════════════════════════════════════════════════════════
        // 4. MT. TAGAPO / SUSONG DALAGA (Talim Island, Binangonan, Rizal)
        // ═══════════════════════════════════════════════════════════════════
        pt("osm-node-967699246", 121.2325293, 14.3392772, "Mount Tagapo (Susong Dalaga)", "summit", {
            ele: "438",
            mountainId: "tagapo",
        }),
        pt("osm-node-2257963074", 121.2193336, 14.3533771, "Tagapo Jump-off (Brgy. Janosa)", "trailhead", {
            mountainId: "tagapo",
        }),
        pt("osm-node-2257972434", 121.2340901, 14.3410428, "Mount Tagapo Ridge Campsite", "camp_site", {
            mountainId: "tagapo",
        }),
        pt("osm-node-2257969877", 121.2175202, 14.3543069, "Brgy. Janosa Port Terminal", "landmark", {
            mountainId: "tagapo",
        }),

        // ═══════════════════════════════════════════════════════════════════
        // 5. MT. SEMBRANO (Brgy. Malaya, Pililla, Rizal)
        // ═══════════════════════════════════════════════════════════════════
        pt("osm-node-332018952", 121.3659025, 14.385076, "Mount Sembrano", "summit", {
            ele: "745",
            mountainId: "sembrano",
        }),
        pt("osm-node-1270248443", 121.365618, 14.386035, "Sembrano North Peak", "sub_peak", {
            ele: "720",
            mountainId: "sembrano",
        }),
        pt("osm-node-1270248451", 121.355302, 14.391575, "Manggahan Campsite", "camp_site", {
            ele: "510",
            mountainId: "sembrano",
        }),
        pt("osm-node-8910950527", 121.3390602, 14.3996328, "Brgy. Malaya Trailhead", "trailhead", {
            mountainId: "sembrano",
        }),

        // ═══════════════════════════════════════════════════════════════════
        // 6. NEARBY EMERGENCY HOSPITALS & RURAL HEALTH CLINICS (OSM Verified)
        // ═══════════════════════════════════════════════════════════════════
        // Batangas (Nasugbu, Calaca, Tuy, Balayan, Tagaytay — serving Mt. Batulao)
        pt("osm-hosp-9921619318", 120.630956, 14.074212, "Ospital ng Nasugbu", "hospital", {
            mountainId: "batulao",
        }),
        pt("osm-hosp-1464084235", 120.633383, 14.064898, "Jabez Medical Center", "hospital", {
            phone: "+63 43 416 0446",
            mountainId: "batulao",
        }),
        pt("osm-hosp-451298674", 120.630965, 14.074232, "Nasugbu Rural Health Unit", "clinic", {
            mountainId: "batulao",
        }),
        pt("osm-hosp-1735379921", 120.633064, 14.0674, "Clinica Nasugbu", "clinic", {
            mountainId: "batulao",
        }),
        pt("osm-hosp-4107873893", 120.633986, 14.064417, "Immanuel Medical Clinic", "clinic", {
            phone: "+63 43 416 0483",
            mountainId: "batulao",
        }),
        pt("osm-hosp-354436673", 120.80002, 13.937148, "Ospital ng Calaca", "hospital", {
            mountainId: "batulao",
        }),
        pt("osm-hosp-457110833", 120.813997, 13.934009, "Calaca Health Center", "clinic", {
            mountainId: "batulao",
        }),
        pt("osm-hosp-865193308", 120.731162, 14.020732, "Tuy Municipal Health Center", "hospital", {
            mountainId: "batulao",
        }),
        pt("osm-hosp-304059261", 120.728337, 13.953955, "Medical Center Western Batangas", "hospital", {
            mountainId: "batulao",
        }),
        pt("osm-hosp-865781871", 120.727884, 13.949443, "Metro Balayan Medical Center", "hospital", {
            mountainId: "batulao",
        }),
        pt("osm-hosp-91696604", 120.940164, 14.099347, "Ospital ng Tagaytay", "hospital", {
            mountainId: "batulao",
        }),
        pt("osm-hosp-9948629187", 120.957713, 14.122452, "Ospital ng Lungsod ng Tagaytay", "hospital", {
            mountainId: "batulao",
        }),
        pt("osm-hosp-5078331472", 120.960768, 14.115355, "Tagaytay Medical Center", "hospital", {
            mountainId: "batulao",
        }),

        // Rizal (Tanay, Pililla, Morong, Cardona, Binangonan — serving Kulis, Daraitan, Sembrano, Tagapo)
        pt("osm-hosp-1051402340", 121.289965, 14.495553, "Tanay General Hospital", "hospital", {
            mountainId: "daraitan",
        }),
        pt("osm-hosp-296863777", 121.283722, 14.500039, "Tanay Municipal Health Center", "clinic", {
            mountainId: "kulis",
        }),
        pt("osm-hosp-11175747503", 121.288952, 14.495698, "Tanay Doctors Care Medical Center", "clinic", {
            mountainId: "kulis",
        }),
        pt("osm-hosp-296968348", 121.305844, 14.481657, "Ynares Community Hospital (Pililla)", "hospital", {
            mountainId: "sembrano",
        }),
        pt("osm-hosp-1570542617", 121.239524, 14.516554, "Rizal Provincial Hospital (Morong Main)", "hospital", {
            mountainId: "sembrano",
        }),
        pt("osm-hosp-962511905", 121.239335, 14.514319, "Morong Doctors Hospital", "hospital", {
            mountainId: "sembrano",
        }),
        pt("osm-hosp-1062760210", 121.234068, 14.490952, "Queen Mary Help of Christians Hospital", "hospital", {
            mountainId: "tagapo",
        }),
        pt("osm-hosp-1226053145", 121.220509, 14.480368, "Carlos Medical & Maternity Hospital", "hospital", {
            mountainId: "tagapo",
        }),
        pt("osm-hosp-860970574", 121.23237, 14.484503, "Cardona Rural Health Center", "clinic", {
            mountainId: "tagapo",
        }),
        pt("osm-hosp-862982038", 121.191511, 14.462661, "Binangonan Municipal Health Center", "clinic", {
            mountainId: "tagapo",
        }),
    ],
};
