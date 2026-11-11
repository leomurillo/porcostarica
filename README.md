# Por Costa Rica

**[Open Por Costa Rica](https://porcostarica.com/)** · [Español](https://porcostarica.com/es/) · [English](https://porcostarica.com/en/)

Questions or feedback? [hola@porcostarica.com](mailto:hola@porcostarica.com)

Find the province, canton, district, and postal code of a location in Costa Rica. The site supports Spanish and English. Select a point on the map, enter coordinates, or use device location.

Link directly to a point with decimal-degree `lat` and `lng` query parameters. For example, [open San Vicente, Moravia (11401)](https://porcostarica.com/?lat=9.962166&lng=-84.048556). The same parameters work on `/es/` and `/en/`. You can also use `lon` for longitude.

The [coordinate link guide for assistants](https://porcostarica.com/llms.txt) includes Spanish and English examples for offering someone a visual check. Each homepage links to the guide in its HTML head and describes the map link with Schema.org structured data.

Run `python -m http.server 8000 --directory docs` from the repository root and open <http://localhost:8000/>. GitHub Pages can serve this directory from the main branch.

After editing homepage markup or translations, run `node generate-pages.mjs` and commit the generated language pages along with your changes.

## Measuring traffic

[docs/analytics.js](docs/analytics.js) loads the published Google tag (`GTM-NXG6LJ6T`, GA4 stream `G-NKR3PCB521`) on the production domain only. It reports page locations without query strings or fragments. A successful lookup sends `district_lookup` with `interface_language`; it does not include the coordinates, district name or postal code.

To check collection, open the production site, find a district and look for `page_view` and `district_lookup` in [Google Analytics](https://analytics.google.com/) under **Reports → Realtime**. Mark `district_lookup` as a **key event** to measure the share of sessions with a successful lookup.

## Google Search

Add the Domain property `porcostarica.com` in [Search Console](https://search.google.com/search-console/). Verify ownership using Google's TXT record in Squarespace DNS. After HTTPS is working, submit [the sitemap](https://porcostarica.com/sitemap.xml) under **Sitemaps**. Inspect the Spanish and English URLs, then choose **Request indexing**. Use the **Performance** report to see which searches bring impressions and clicks.

District boundaries come from IGN/SNIT (layer IGN_5_CO:limitedistrital_5k, version 20260410001). Regional outlines come from Natural Earth and street tiles from OpenStreetMap. The browser map uses Leaflet, with its license included in docs/.

To rebuild the map files from IGN district polygons in EPSG:4326 and Natural Earth 1:50m countries, run `uv run --with shapely python prepare.py districts.geojson countries.geojson`.
