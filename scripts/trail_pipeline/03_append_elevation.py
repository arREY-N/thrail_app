import json
import math
import os
import time
import requests

BASE_DIR = "src/assets/map_data/trails"


def haversine_m(lon1, lat1, lon2, lat2):
    R = 6371000.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0) ** 2
    return R * 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))


def fetch_eles(coords):
    res = [None] * len(coords)
    for i in range(0, len(coords), 40):
        batch = coords[i:i + 40]
        lats = ",".join(f"{c[1]:.6f}" for c in batch)
        lons = ",".join(f"{c[0]:.6f}" for c in batch)
        url = f"https://api.open-meteo.com/v1/elevation?latitude={lats}&longitude={lons}"
        for att in range(5):
            try:
                r = requests.get(url, timeout=20)
                if r.status_code == 200:
                    for j, v in enumerate(r.json().get("elevation", [])):
                        if v is not None:
                            res[i + j] = float(v)
                    break
            except Exception:
                time.sleep(1.5 * (att + 1))
        time.sleep(0.25)

    # Interpolate any missing point from nearest valid neighbors
    n = len(res)
    for idx in range(n):
        if res[idx] is None or res[idx] <= 0:
            prev_val = next((res[k] for k in range(idx - 1, -1, -1) if res[k] is not None and res[k] > 0), None)
            next_val = next((res[k] for k in range(idx + 1, n) if res[k] is not None and res[k] > 0), None)
            if prev_val is not None and next_val is not None:
                res[idx] = 0.5 * (prev_val + next_val)
            elif prev_val is not None:
                res[idx] = prev_val
            elif next_val is not None:
                res[idx] = next_val
            else:
                res[idx] = 100.0
    return res


def main():
    report_path = os.path.join(BASE_DIR, "extraction_report.json")
    with open(report_path, "r", encoding="utf-8") as f:
        report = json.load(f)

    master_feats = []
    for mt_id, mt_info in report["mountains"].items():
        mt_feats = []
        for tr_info in mt_info["trails"]:
            fpath = os.path.join(BASE_DIR, tr_info["file"])
            with open(fpath, "r", encoding="utf-8") as tf:
                fc = json.load(tf)
            feat = fc["features"][0]
            coords = feat["geometry"]["coordinates"]
            eles = fetch_eles(coords)
            for k in range(len(coords)):
                coords[k] = [round(coords[k][0], 7), round(coords[k][1], 7), round(float(eles[k]), 1)]

            dist, gain, loss = 0.0, 0.0, 0.0
            for k in range(len(coords) - 1):
                dist += haversine_m(coords[k][0], coords[k][1], coords[k + 1][0], coords[k + 1][1])
                d = coords[k + 1][2] - coords[k][2]
                if d > 0:
                    gain += d
                elif d < 0:
                    loss += abs(d)

            dist, gain, loss = round(dist, 1), round(gain, 1), round(loss, 1)
            feat["properties"]["total_distance_m"] = dist
            feat["properties"]["elevation_gain_m"] = gain
            feat["properties"]["elevation_loss_m"] = loss
            feat["properties"]["start_coordinate"] = coords[0]
            feat["properties"]["end_coordinate"] = coords[-1]
            tr_info["total_distance_m"] = dist
            tr_info["elevation_gain_m"] = gain
            tr_info["elevation_loss_m"] = loss

            with open(fpath, "w", encoding="utf-8") as tf:
                json.dump(fc, tf, indent=2)
            mt_feats.append(feat)
            master_feats.append(feat)
            print(
                f"  [OK] {tr_info['file']}: {len(coords)} pts, {dist}m, "
                f"+{gain}m/-{loss}m, start_ele={coords[0][2]}m -> end_ele={coords[-1][2]}m"
            )

        with open(os.path.join(BASE_DIR, mt_info["combined_file"]), "w", encoding="utf-8") as af:
            json.dump({"type": "FeatureCollection", "features": mt_feats}, af, indent=2)

    with open(os.path.join(BASE_DIR, "master_all_mountains.geojson"), "w", encoding="utf-8") as mf:
        json.dump({"type": "FeatureCollection", "features": master_feats}, mf, indent=2)
    with open(report_path, "w", encoding="utf-8") as rf:
        json.dump(report, rf, indent=2)


if __name__ == "__main__":
    main()
