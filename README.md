# Por Costa Rica

Find the province, canton, district, and postal code of a location in Costa Rica. The site supports Spanish and English. Select a point on the map, enter coordinates, or use device location.

Run `python -m http.server 8000 --directory docs` from the repository root and open <http://localhost:8000/>. GitHub Pages can serve this directory from the main branch.

District boundaries come from IGN/SNIT (layer IGN_5_CO:limitedistrital_5k, version 20260410001). Regional outlines come from Natural Earth and street tiles from OpenStreetMap. The browser map uses Leaflet, with its license included in docs/.

To rebuild the map files from IGN district polygons in EPSG:4326 and Natural Earth 1:50m countries, run `uv run --with shapely python prepare.py districts.geojson countries.geojson`.
