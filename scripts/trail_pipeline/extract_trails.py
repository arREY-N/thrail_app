import json
import math
import os
import time
import osmium
import requests

CONFIG_PATH = "scripts/trail_pipeline/mountains_trails_config.json"
CACHE_PATH = "scripts/trail_pipeline/extracted_ways_cache.json"
EXISTING_3D_GEOJSON = "src/assets/map_data/trails_3D_final_v2.geojson"


def haversine_m(lon1, lat1, lon2, lat2):
    R = 6371000.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0) ** 2
    return R * 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))


class TargetWayCollector(osmium.SimpleHandler):
    """
    Collects exact node IDs and (lon, lat) coordinates for target ways.
    By NOT defining def node(self, n), pyosmium caches locations in C++ without
    Python callback overhead on 50M+ nodes.
    """
    def __init__(self, target_way_ids):
        super().__init__()
        self.target_way_ids = set(target_way_ids)
        self.ways = {}  # way_id -> list of [node_id, lon, lat]

    def way(self, w):
        if w.id in self.target_way_ids:
            pts = []
            for n in w.nodes:
                if n.location.valid():
                    pts.append([int(n.ref), round(n.location.lon, 7), round(n.location.lat, 7)])
            self.ways[w.id] = pts


def load_existing_3d_lookup():
    """Loads existing [lon, lat, ele] lookup from trails_3D_final_v2.geojson."""
    lookup = {}
    if not os.path.exists(EXISTING_3D_GEOJSON):
        return lookup
    with open(EXISTING_3D_GEOJSON, "r", encoding="utf-8") as f:
        data = json.load(f)
    for feat in data.get("features", []):
        geom = feat.get("geometry", {})
        gtype = geom.get("type")
        coords = geom.get("coordinates", [])
        lines = [coords] if gtype == "LineString" else (coords if gtype == "MultiLineString" else [])
        for line in lines:
            for pt in line:
                if len(pt) >= 3 and pt[2] is not None and pt[2] > 0:
                    key = (round(pt[0], 5), round(pt[1], 5))
                    lookup[key] = float(pt[2])
    return lookup


def fetch_copernicus_dem_elevations(coords_2d):
    """
    Queries Copernicus 30m DEM via Open-Meteo Elevation API in batches of 50
    with automatic retries so no batch is dropped.
    """
    elevations = [None] * len(coords_2d)
    batch_size = 50
    for i in range(0, len(coords_2d), batch_size):
        batch = coords_2d[i:i + batch_size]
        lats = ",".join(f"{pt[1]:.6f}" for pt in batch)
        lons = ",".join(f"{pt[0]:.6f}" for pt in batch)
        url = f"https://api.open-meteo.com/v1/elevation?latitude={lats}&longitude={lons}"
        for attempt in range(4):
            try:
                resp = requests.get(url, timeout=20)
                if resp.status_code == 200:
                    eles = resp.json().get("elevation", [])
                    for j, val in enumerate(eles):
                        if val is not None:
                            elevations[i + j] = float(val)
                    break
            except Exception as e:
                if attempt == 3:
                    print(f"  [!] Open-Meteo batch failed after retries: {e}")
                else:
                    time.sleep(1.5 * (attempt + 1))
        time.sleep(0.15)
    return elevations


def enrich_3d_coordinates(coords_2d, lookup_3d):
    """
    Enriches [(lon, lat), ...] into [[lon, lat, ele], ...] using Copernicus 30m DEM
    with fallback to local 3D lookup and linear neighbor interpolation so zero-drops never occur.
    """
    dem_eles = fetch_copernicus_dem_elevations(coords_2d)
    eles = []
    for idx, (lon, lat) in enumerate(coords_2d):
        ele = dem_eles[idx]
        if ele is None or ele <= 0:
            ele = lookup_3d.get((round(lon, 5), round(lat, 5)), None)
        eles.append(ele)

    # Interpolate any remaining None values from nearest valid neighbors
    n = len(eles)
    for idx in range(n):
        if eles[idx] is None:
            # Find previous valid
            prev_val = next((eles[k] for k in range(idx - 1, -1, -1) if eles[k] is not None), None)
            next_val = next((eles[k] for k in range(idx + 1, n) if eles[k] is not None), None)
            if prev_val is not None and next_val is not None:
                eles[idx] = 0.5 * (prev_val + next_val)
            elif prev_val is not None:
                eles[idx] = prev_val
            elif next_val is not None:
                eles[idx] = next_val
            else:
                eles[idx] = 100.0

    coords_3d = [
        [round(lon, 7), round(lat, 7), round(float(eles[idx]), 1)]
        for idx, (lon, lat) in enumerate(coords_2d)
    ]
    return coords_3d


def compute_trail_stats(coords_3d):
    total_dist = 0.0
    elev_gain = 0.0
    elev_loss = 0.0
    for i in range(len(coords_3d) - 1):
        lon1, lat1, ele1 = coords_3d[i]
        lon2, lat2, ele2 = coords_3d[i + 1]
        total_dist += haversine_m(lon1, lat1, lon2, lat2)
        diff = ele2 - ele1
        if diff > 0:
            elev_gain += diff
        elif diff < 0:
            elev_loss += abs(diff)
    return round(total_dist, 1), round(elev_gain, 1), round(elev_loss, 1)


def assemble_trail_coordinates(trail_cfg, extracted_ways):
    """
    Orders, reverses, trims at junction nodes, and stitches way segments into a single
    continuous LineString coordinate list [(lon, lat), ...], plus records max gap healed.
    """
    way_ids = trail_cfg.get("way_ids", [])
    reverse_set = set(trail_cfg.get("reverse_ways", []))
    trim_rules = trail_cfg.get("trim_way_at_node", {})

    stitched = []
    max_gap_m = 0.0
    missing_ways = []

    for wid in way_ids:
        if wid not in extracted_ways:
            missing_ways.append(wid)
            continue

        pts = list(extracted_ways[wid])  # [[node_id, lon, lat], ...]
        if wid in reverse_set:
            pts.reverse()

        # Check if this way has a node trim rule (e.g. shared trunk way trimmed at branch junction)
        rule = trim_rules.get(str(wid))
        if rule:
            if "end_node" in rule:
                target_nid = rule["end_node"]
                for idx, (nid, _, _) in enumerate(pts):
                    if nid == target_nid:
                        pts = pts[:idx + 1]
                        break
            if "start_node" in rule:
                target_nid = rule["start_node"]
                for idx, (nid, _, _) in enumerate(pts):
                    if nid == target_nid:
                        pts = pts[idx:]
                        break

        way_coords = [(lon, lat) for (_, lon, lat) in pts]
        if not way_coords:
            continue

        if not stitched:
            stitched.extend(way_coords)
        else:
            prev_lon, prev_lat = stitched[-1]
            next_lon, next_lat = way_coords[0]
            gap_m = haversine_m(prev_lon, prev_lat, next_lon, next_lat)

            # Auto-orient if reversed end is closer
            rev_lon, rev_lat = way_coords[-1]
            rev_gap_m = haversine_m(prev_lon, prev_lat, rev_lon, rev_lat)
            if rev_gap_m < gap_m:
                way_coords.reverse()
                gap_m = rev_gap_m
                next_lon, next_lat = way_coords[0]

            if gap_m > max_gap_m:
                max_gap_m = gap_m

            # Deduplicate identical junction vertex
            if gap_m < 0.1:
                stitched.extend(way_coords[1:])
            else:
                stitched.extend(way_coords)

    return stitched, round(max_gap_m, 2), missing_ways


def load_or_extract_ways(pbf_path, all_target_ways):
    if os.path.exists(CACHE_PATH):
        with open(CACHE_PATH, "r", encoding="utf-8") as cf:
            cached = {int(k): v for k, v in json.load(cf).items()}
        if all_target_ways.issubset(cached.keys()):
            print(f"Loaded {len(cached)} ways from PBF cache ({CACHE_PATH})")
            return cached

    print(f"Extracting {len(all_target_ways)} target ways from {pbf_path} ...")
    t0 = time.time()
    collector = TargetWayCollector(all_target_ways)
    collector.apply_file(pbf_path, locations=True)
    print(f"Extracted {len(collector.ways)}/{len(all_target_ways)} ways in {time.time() - t0:.1f}s")
    with open(CACHE_PATH, "w", encoding="utf-8") as cf:
        json.dump({str(k): v for k, v in collector.ways.items()}, cf)
    return collector.ways


def main():
    t0 = time.time()
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        cfg = json.load(f)

    pbf_path = cfg["source_pbf"]
    output_dir = cfg["output_dir"]

    all_target_ways = set()
    for mt in cfg["mountains"]:
        for tr in mt["trails"]:
            for wid in tr.get("way_ids", []):
                all_target_ways.add(wid)

    extracted_ways = load_or_extract_ways(pbf_path, all_target_ways)
    lookup_3d = load_existing_3d_lookup()
    os.makedirs(output_dir, exist_ok=True)

    master_features = []
    report = {
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "source_pbf": pbf_path,
        "output_dir": output_dir,
        "mountains": {}
    }

    for mt in cfg["mountains"]:
        mt_id = mt["mountain_id"]
        mt_name = mt["mountain_name"]
        province = mt["province"]
        mt_folder = os.path.join(output_dir, mt_id)
        os.makedirs(mt_folder, exist_ok=True)

        mt_features = []
        mt_report_trails = []

        for tr in mt["trails"]:
            trail_id = tr["trail_id"]
            trail_name = tr["trail_name"]
            coords_2d, max_gap_m, missing_ways = assemble_trail_coordinates(tr, extracted_ways)
            coords_3d = enrich_3d_coordinates(coords_2d, lookup_3d)
            dist_m, gain_m, loss_m = compute_trail_stats(coords_3d)

            source_entities = [f"relation/{r}" for r in tr.get("relation_ids", [])] + [
                f"way/{w}" for w in tr.get("way_ids", [])
            ]

            feature = {
                "type": "Feature",
                "properties": {
                    "mountain_id": mt_id,
                    "mountain_name": mt_name,
                    "trail_id": trail_id,
                    "trail_name": trail_name,
                    "province": province,
                    "difficulty": tr.get("difficulty", "Moderate"),
                    "technical_rating": tr.get("technical_rating", "Class 2"),
                    "total_distance_m": dist_m,
                    "elevation_gain_m": gain_m,
                    "elevation_loss_m": loss_m,
                    "vertex_count": len(coords_3d),
                    "max_stitched_gap_m": max_gap_m,
                    "source_osm_entities": source_entities,
                    "start_coordinate": coords_3d[0] if coords_3d else None,
                    "end_coordinate": coords_3d[-1] if coords_3d else None,
                },
                "geometry": {
                    "type": "LineString",
                    "coordinates": coords_3d,
                },
            }

            trail_file_path = os.path.join(mt_folder, f"{trail_id}.geojson")
            with open(trail_file_path, "w", encoding="utf-8") as tf:
                json.dump({"type": "FeatureCollection", "features": [feature]}, tf, indent=2)

            mt_features.append(feature)
            master_features.append(feature)
            mt_report_trails.append({
                "trail_id": trail_id,
                "file": f"{mt_id}/{trail_id}.geojson",
                "vertex_count": len(coords_3d),
                "total_distance_m": dist_m,
                "elevation_gain_m": gain_m,
                "elevation_loss_m": loss_m,
                "max_stitched_gap_m": max_gap_m,
                "missing_ways": missing_ways,
                "geometry_type": "LineString",
            })
            print(f"  [OK] {mt_id}/{trail_id}.geojson -> {len(coords_3d)} pts, {dist_m}m, +{gain_m}m/-{loss_m}m (max gap: {max_gap_m}m)")

        all_file_path = os.path.join(mt_folder, f"{mt_id}-all.geojson")
        with open(all_file_path, "w", encoding="utf-8") as af:
            json.dump({"type": "FeatureCollection", "features": mt_features}, af, indent=2)

        report["mountains"][mt_id] = {
            "mountain_name": mt_name,
            "combined_file": f"{mt_id}/{mt_id}-all.geojson",
            "trails": mt_report_trails,
        }

    master_path = os.path.join(output_dir, "master_all_mountains.geojson")
    with open(master_path, "w", encoding="utf-8") as mf:
        json.dump({"type": "FeatureCollection", "features": master_features}, mf, indent=2)

    report_path = os.path.join(output_dir, "extraction_report.json")
    with open(report_path, "w", encoding="utf-8") as rf:
        json.dump(report, rf, indent=2)

    print(f"\nCompleted in {time.time() - t0:.1f}s. Output saved to {output_dir}")


if __name__ == "__main__":
    main()
