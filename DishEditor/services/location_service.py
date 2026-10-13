class LocationService:
    def __init__(self):
        self._geo = None
        self._cities = None
        self._countries = None
        self._subdivisions = None

    def _get_geo(self):
        if self._geo is None:
            import geonamescache

            self._geo = geonamescache.GeonamesCache(
                min_city_population=5000
            )

        return self._geo

    def _get_countries(self):
        if self._countries is None:
            self._countries = (
                self._get_geo().get_countries()
            )

        return self._countries

    def _get_cities(self):
        if self._cities is None:
            self._cities = (
                self._get_geo().get_cities()
            )

        return self._cities

    def _get_subdivisions(self):
        if self._subdivisions is None:
            from iso3166_2 import Subdivisions

            self._subdivisions = Subdivisions()

        return self._subdivisions

    def get_regions(
        self,
        country_alpha3: str,
    ) -> list[str]:
        try:
            subdivisions = (
                self._get_subdivisions()[
                    country_alpha3
                ]
            )
        except Exception:
            return []

        region_names = []

        for subdivision in subdivisions.values():
            name = getattr(
                subdivision,
                "name",
                None,
            )

            if name:
                region_names.append(name)

        return sorted(
            set(region_names)
        )

    def get_cities(
        self,
        country_alpha3: str,
    ) -> list[str]:
        countries = self._get_countries()

        # geonamescache хранит страны по alpha-2,
        # а у нас используется alpha-3.
        country_alpha2 = None

        for alpha2, country in countries.items():
            if country.get("iso3") == country_alpha3:
                country_alpha2 = alpha2
                break

        if not country_alpha2:
            return []

        cities = self._get_cities()

        city_names = [
            city["name"]
            for city in cities.values()
            if city.get("countrycode")
            == country_alpha2
        ]

        return sorted(
            set(city_names)
        )