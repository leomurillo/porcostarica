"""Build browser assets from IGN WFS GeoJSON (EPSG:4326) and Natural Earth 1:50m countries.

Usage: uv run --with shapely python prepare.py districts.geojson countries.geojson
"""
import json
import sys
from collections import defaultdict
from pathlib import Path

from shapely.geometry import box, mapping, shape

out = Path(__file__).parent / "docs" / "map"
out.mkdir(exist_ok=True)


def save(name, data):
    (out / name).write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf8")


def encode_ring(ring):
    packed = []
    x = y = 0
    for lng, lat, *_ in ring:
        nx, ny = round(lng * 1000000), round(lat * 1000000)
        packed.extend((nx - x, ny - y))
        x, y = nx, ny
    return packed


def polygon_parts(geom):
    return [geom] if geom.geom_type == "Polygon" else geom.geoms


def main():
    features = json.loads(Path(sys.argv[1]).read_text(encoding="utf8"))["features"]
    overview, index = [], []
    regions = defaultdict(dict)
    for f in features:
        p = f["properties"]
        code = str(p["CÓDIGO_DTA"])
        geom = shape(f["geometry"])
        overview.append({"type": "Feature", "properties": {"p": int(code[0])},
                         "geometry": mapping(geom.simplify(.003, preserve_topology=True))})
        index.append([code, p["PROVINCIA"], p["CANTÓN"], p["DISTRITO"], geom.bounds])
        regions[code[:3]][code] = [
            [encode_ring(poly.exterior.coords), *(encode_ring(r.coords) for r in poly.interiors)]
            for poly in polygon_parts(geom)
        ]
    for region, districts in regions.items():
        save(region + ".json", districts)
    save("index.json", index)
    save("overview.json", {"type": "FeatureCollection", "features": overview})
    clip = box(-91, 3, -77, 16)
    countries = json.loads(Path(sys.argv[2]).read_text(encoding="utf8"))["features"]
    neighbors = [mapping(shape(f["geometry"]).intersection(clip).simplify(.003))
                 for f in countries if f["properties"]["ADMIN"] != "Costa Rica"
                 and shape(f["geometry"]).intersects(clip)]
    save("neighbors.json", {"type": "GeometryCollection", "geometries": neighbors})
    print(f"{len(index)} districts in {len(regions)} cantons")


if __name__ == "__main__":
    main()
