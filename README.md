# Por Costa Rica

**[Open Por Costa Rica](https://porcostarica.com/)** · [Español](https://porcostarica.com/es/) · [English](https://porcostarica.com/en/)

Find the province, canton, district, and postal code of a location in Costa Rica. The site supports Spanish and English. Select a point on the map, enter coordinates, or use device location.

Link directly to a point with decimal-degree `lat` and `lng` query parameters. For example, [open San Vicente, Moravia (11401)](https://porcostarica.com/?lat=9.962166&lng=-84.048556). The same parameters work on `/es/` and `/en/`. You can also use `lon` for longitude.

Run `python -m http.server 8000 --directory docs` from the repository root and open <http://localhost:8000/>. GitHub Pages can serve this directory from the main branch.

After editing homepage markup or translations, run `node generate-pages.mjs` and commit the generated language pages along with your changes.

## Measuring traffic

1. In [Google Analytics](https://analytics.google.com/), create a GA4 property for Por Costa Rica and a **Web** data stream for `https://porcostarica.com`. Turn off **Enhanced measurement** if you only want page views and the explicit lookup event.
2. Copy the stream's public Measurement ID (starts with `G-`) into the empty `gaMeasurementId` string in [docs/analytics.js](docs/analytics.js). Commit to `main`. No Analytics tag loads until this is set.
3. After deployment, visit the production site and complete one lookup. Check **Reports → Realtime** for a page view and a `district_lookup` event. This custom event includes the interface language and omits the coordinates, postal code and district name. Mark it as a **key event** to measure the share of sessions that complete a lookup.

## Google Search

Add the Domain property `porcostarica.com` in [Search Console](https://search.google.com/search-console/). Verify ownership using Google's TXT record in Squarespace DNS. After HTTPS is working, submit [the sitemap](https://porcostarica.com/sitemap.xml) under **Sitemaps**. Inspect the Spanish and English URLs, then choose **Request indexing**. Use the **Performance** report to see which searches bring impressions and clicks.

District boundaries come from IGN/SNIT (layer IGN_5_CO:limitedistrital_5k, version 20260410001). Regional outlines come from Natural Earth and street tiles from OpenStreetMap. The browser map uses Leaflet, with its license included in docs/.

To rebuild the map files from IGN district polygons in EPSG:4326 and Natural Earth 1:50m countries, run `uv run --with shapely python prepare.py districts.geojson countries.geojson`.
