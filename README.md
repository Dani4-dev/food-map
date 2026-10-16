# FoodMap — World Food Atlas / 世界の料理アトラス

An interactive culinary atlas built with React, TypeScript, Vite, and Leaflet.
The website reads the bilingual dish records maintained by the Python/Tkinter desktop editor.

## Development

```sh
npm install
npm run dev
npm test
npm run lint
npm run build
npm run preview
```

The build checks TypeScript before producing the website. Deployment is a separate,
explicit action; the configured GitHub Pages base path is `/food-map/`.

## Explore

- Select countries on the world map.
- At zoom 5–8, clicking the map selects a region; at zoom 9+, it selects a city or town.
- Search by country, region, city, or English/Japanese dish name. Submit geographic searches
  using the search button or Enter. Local place suggestions do not send network requests.
- Suggestions appear while typing: all countries plus dishes, regions, and cities from
  the local collection. Select with a click or ↑/↓ and Enter; Escape closes the menu.
- Use the region/city filters to browse places represented in the dish collection.
- Browse up to ten dishes per page. On desktop the card grid scrolls independently.
- Open a card's recipe for its description, origin, ingredients, and preparation.
- Use a card's map button to navigate to its recorded origin.
- Switch the interface and dish text between English and Japanese.

Country outlines load from `johan/world.geo.json`; map tiles come from OpenStreetMap.
Regions and cities are identified by Nominatim reverse geocoding rather than a bundled
worldwide subdivision database. Results depend on OpenStreetMap coverage.
Geographic lookups use English names to match the origin names in the dish JSON.
Different spellings in JSON may need correction to match a geographic result.
The local filters remain available without geocoding.

Nominatim requests are serialized, cached in memory, and spaced at least 1.1 seconds apart.
The public service is suitable for modest use, not high-traffic deployment:
[Nominatim usage policy](https://operations.osmfoundation.org/policies/nominatim/).
Configure another provider in `src/services/geographyService.ts` when scaling.
UI labels and local dish search work without these services, but map tiles, geographic
lookups, and web fonts require an internet connection.

## Source structure

- `src/App.tsx`: search, location selection, filters, and recipe state.
- `src/components/WorldMap.tsx`: map, zoom-dependent selection, and selection marker.
- `src/components/FoodPanel.tsx`: card grid and pagination.
- `src/components/DishCard.tsx`, `DishDetails.tsx`: dish preview and accessible recipe dialog.
- `src/services/dishService.ts`: local filtering, bilingual search, and recipe projection.
- `src/services/geographyService.ts`: geographic search, reverse lookup, and request queue.
- `src/data/foodDatabase.ts`: Vite imports of the editor's JSON and images.
- `src/data/countries.json`: ISO alpha-2/alpha-3 country lookup.
- `src/i18n/`: English/Japanese translations and localized country names.
- `DishEditor/`: desktop editor, views, forms, and location services.
- `tests/atlas.test.mjs`: data, search, origin filtering, and localization checks.

The older Wikipedia/Wikidata services and `src/data/foodDatabase.json` are retained
for compatibility and are not used by the current browsing experience.

## Dish records and images

Store one record per `DishEditor/dishes/<country folder>/*.json`.
Use ISO 3166-1 alpha-3 for `origin.country`, for example `RUS`, `NPL`, or `JPN`.
The loader also recognizes alpha-2 codes and standard English country names for
compatibility, converting them to alpha-3 in memory without rewriting the JSON.

Records support `id`, localized `name` and `description`, `origin.country`,
`origin.region`, `origin.city`, `recipe.ingredients`, `recipe.preparation`,
and a relative `image` path such as `Pictures/Tula Pryanik.jpeg`.
English and Japanese are optional independently; missing or empty text falls back
to the other language. Unavailable recipe sections show an explanatory message.

Put pictures in `DishEditor/dishes/Pictures/`. File names, spaces, case, and extensions
must match the JSON path exactly. Cards use a fixed image height and `object-fit: cover`;
missing pictures receive a decorative placeholder.

The website bundles data and pictures at build time. Rebuild after editing records.
The packaged editor stores dishes beside its executable; copy those records and
pictures into the source data directory before building the website.

## 日本語

地図で国を選び、拡大すると地域や都市をクリックして郷土料理を探せます。
国・地域・都市・料理名で検索でき、料理は1ページに最大10件表示されます。
カードから材料・作り方を含むレシピを開けます。
地域・都市の特定には外部サービスを利用するため、インターネット接続が必要です。

料理データは `DishEditor/dishes/<国フォルダー>/*.json` に保存します。
国コードには ISO alpha-3 を使用し、画像パスは実際のファイル名と一致させてください。
データを変更した後はウェブサイトを再ビルドしてください。
