import json
import tkinter as tk

from datetime import datetime
from pathlib import Path
from tkinter import ttk

from countries import COUNTRIES
from services.app_paths import get_dishes_directory


class DishListView(ttk.Frame):
    CARD_MIN_WIDTH = 150
    CARD_GAP = 10

    def __init__(self, parent, on_view=None, on_edit=None):
        super().__init__(parent)

        self.on_view = on_view
        self.on_edit = on_edit

        self.dishes = []
        self.visible_dishes = []
        self.card_widgets = []

        self.current_column_count = 0

        self.search_var = tk.StringVar()
        self.country_var = tk.StringVar(value="All countries")
        self.sort_var = tk.StringVar(value="A → Z")

        self.create_widgets()

        self.load_dishes()

        self.refresh_list()

        self.bind(
            "<Configure>",
            self.on_resize,
        )

    def create_widgets(self):
        # -------------------------
        # Header
        # -------------------------

        ttk.Label(
            self,
            text="Dish list",
            font=("Arial", 20, "bold"),
        ).pack(
            anchor="w",
            pady=(0, 15),
        )

        # -------------------------
        # Filters
        # -------------------------

        filters = ttk.Frame(self)

        filters.pack(
            fill="x",
            pady=(0, 20),
        )

        filters.columnconfigure(
            0,
            weight=1,
        )

        # Search
        self.search_entry = ttk.Entry(
            filters,
            textvariable=self.search_var,
        )

        self.search_entry.grid(
            row=0,
            column=0,
            sticky="ew",
            padx=(0, 10),
        )

        self.search_entry.bind(
            "<KeyRelease>",
            lambda event: self.refresh_list(),
        )

        # Country
        country_filter = ttk.Combobox(
            filters,
            textvariable=self.country_var,
            values=[
                "All countries",
                *COUNTRIES.keys(),
            ],
            state="readonly",
            width=20,
        )

        country_filter.grid(
            row=0,
            column=1,
            padx=(0, 10),
        )

        country_filter.bind(
            "<<ComboboxSelected>>",
            lambda event: self.refresh_list(),
        )

        # Sorting
        sort_filter = ttk.Combobox(
            filters,
            textvariable=self.sort_var,
            values=[
                "A → Z",
                "Z → A",
                "Newest",
                "Oldest",
            ],
            state="readonly",
            width=15,
        )

        sort_filter.grid(
            row=0,
            column=2,
        )

        sort_filter.bind(
            "<<ComboboxSelected>>",
            lambda event: self.refresh_list(),
        )

        # -------------------------
        # Cards
        # -------------------------

        self.cards_frame = ttk.Frame(self)

        self.cards_frame.pack(
            fill="x",
            expand=True,
        )

    def load_dishes(self):
        self.dishes.clear()

        dishes_directory = get_dishes_directory()

        if not dishes_directory.exists():
            return

        for json_path in dishes_directory.rglob("*.json"):

            try:
                with open(
                    json_path,
                    "r",
                    encoding="utf-8",
                ) as file:
                    dish = json.load(file)

                dish["_path"] = json_path

                if dish.get("createdAt"):
                    try:
                        dish["_timestamp"] = datetime.fromisoformat(
                            dish["createdAt"]
                        ).timestamp()
                    except ValueError:
                        dish["_timestamp"] = json_path.stat().st_mtime
                else:
                    dish["_timestamp"] = json_path.stat().st_mtime

                self.dishes.append(dish)

            except Exception as error:
                print(
                    f"Failed to load {json_path}:",
                    error,
                )

    def get_country_name(
        self,
        country_code: str,
    ) -> str:
        for name, code in COUNTRIES.items():
            if code == country_code:
                return name

        return country_code

    def get_display_name(self, dish) -> str:
        names = dish.get("name", {})

        return (
            names.get("en")
            or names.get("ja")
            or "Unnamed dish"
        )

    def matches_search(self, dish) -> bool:
        query = (
            self.search_var
            .get()
            .strip()
            .lower()
        )

        if not query:
            return True

        names = dish.get("name", {})

        name_en = (
            names.get("en", "")
            .lower()
        )

        name_ja = (
            names.get("ja", "")
            .lower()
        )

        return (
            query in name_en
            or query in name_ja
        )

    def matches_country(self, dish) -> bool:
        selected_country = (
            self.country_var.get()
        )

        if selected_country == "All countries":
            return True

        selected_code = COUNTRIES.get(
            selected_country
        )

        dish_code = (
            dish
            .get("origin", {})
            .get("country")
        )

        return dish_code == selected_code

    def sort_dishes(self, dishes):
        sort_mode = self.sort_var.get()

        if sort_mode == "A → Z":
            return sorted(
                dishes,
                key=lambda dish:
                    self.get_display_name(
                        dish
                    ).lower(),
            )

        if sort_mode == "Z → A":
            return sorted(
                dishes,
                key=lambda dish:
                    self.get_display_name(
                        dish
                    ).lower(),
                reverse=True,
            )

        if sort_mode == "Newest":
            return sorted(
                dishes,
                key=lambda dish:
                    dish.get(
                        "_timestamp",
                        0,
                    ),
                reverse=True,
            )

        if sort_mode == "Oldest":
            return sorted(
                dishes,
                key=lambda dish:
                    dish.get(
                        "_timestamp",
                        0,
                    ),
            )

        return dishes

    def refresh_list(self):
        self.visible_dishes = [
            dish
            for dish in self.dishes
            if self.matches_search(dish)
            and self.matches_country(dish)
        ]

        self.visible_dishes = self.sort_dishes(
            self.visible_dishes
        )

        self.rebuild_cards()

    def rebuild_cards(self):
        for widget in self.cards_frame.winfo_children():
            widget.destroy()

        self.card_widgets.clear()

        if not self.visible_dishes:
            ttk.Label(
                self.cards_frame,
                text="No dishes found.",
            ).grid(
                row=0,
                column=0,
                sticky="w",
                pady=30,
            )

            return

        for dish in self.visible_dishes:
            card = self.create_dish_card(
                dish
            )

            self.card_widgets.append(
                card
            )

        self.after_idle(
            self.layout_cards
        )

    def create_dish_card(self, dish):
        card = ttk.LabelFrame(
            self.cards_frame,
            padding=15,
        )

        card.columnconfigure(
            0,
            weight=1,
        )

        # -------------------------
        # Names
        # -------------------------

        names = dish.get(
            "name",
            {},
        )

        name_en = names.get(
            "en",
            "",
        )

        name_ja = names.get(
            "ja",
            "",
        )

        title_parts = []

        if name_en:
            title_parts.append(
                name_en
            )

        if name_ja:
            title_parts.append(
                name_ja
            )

        title = " / ".join(
            title_parts
        )

        ttk.Label(
            card,
            text=title or "Unnamed dish",
            font=("Arial", 14, "bold"),
            wraplength=260,
            justify="left",
        ).grid(
            row=0,
            column=0,
            sticky="w",
        )

        # -------------------------
        # Location
        # -------------------------

        origin = dish.get(
            "origin",
            {},
        )

        country_code = origin.get(
            "country",
            "",
        )

        country_name = (
            self.get_country_name(
                country_code
            )
        )

        location_parts = []

        if country_name:
            location_parts.append(
                country_name
            )

        region = origin.get(
            "region"
        )

        city = origin.get(
            "city"
        )

        if region:
            location_parts.append(
                region
            )

        if city:
            location_parts.append(
                city
            )

        ttk.Label(
            card,
            text=" • ".join(
                location_parts
            ),
        ).grid(
            row=1,
            column=0,
            sticky="w",
            pady=(6, 0),
        )

        # -------------------------
        # Description
        # -------------------------

        description = dish.get(
            "description",
            {},
        )

        description_text = (
            description.get("en")
            or description.get("ja")
            or ""
        )

        if description_text:
            ttk.Label(
                card,
                text=description_text,
                wraplength=260,
                justify="left",
            ).grid(
                row=2,
                column=0,
                sticky="nw",
                pady=(10, 0),
            )

        buttons_frame = ttk.Frame(card)

        buttons_frame.grid(
            row=3,
            column=0,
            sticky="ew",
            pady=(12, 0),
        )

        buttons_frame.columnconfigure(0, weight=1)
        buttons_frame.columnconfigure(1, weight=1)

        json_path = dish.get("_path")

        ttk.Button(
            buttons_frame,
            text="View",
            command=lambda path=json_path: self.open_view(path),
        ).grid(
            row=0,
            column=0,
            sticky="ew",
            padx=(0, 3),
        )

        ttk.Button(
            buttons_frame,
            text="Edit",
            command=lambda path=json_path: self.open_edit(path),
        ).grid(
            row=0,
            column=1,
            sticky="ew",
            padx=(3, 0),
        )

        return card

    def open_view(self, json_path):
        if self.on_view and json_path:
            self.on_view(json_path)


    def open_edit(self, json_path):
        if self.on_edit and json_path:
            self.on_edit(json_path)

    def calculate_column_count(self):
        width = self.winfo_width()

        if width <= 1:
            return 1

        return max(
            1,
            width
            // (
                self.CARD_MIN_WIDTH
                + self.CARD_GAP
            ),
        )

    def layout_cards(self):
        if not self.card_widgets:
            return

        column_count = (
            self.calculate_column_count()
        )

        self.current_column_count = (
            column_count
        )

        # Remove old grid positions
        for card in self.card_widgets:
            card.grid_forget()

        # Reset column weights
        for column in range(10):
            self.cards_frame.columnconfigure(
                column,
                weight=0,
            )

        # Active columns expand evenly
        for column in range(column_count):
            self.cards_frame.columnconfigure(
                column,
                weight=1,
                uniform="dish_columns",
            )

        # Place cards
        for index, card in enumerate(
            self.card_widgets
        ):
            row = index // column_count
            column = index % column_count

            card.grid(
                row=row,
                column=column,
                sticky="nsew",
                padx=5,
                pady=5,
            )

    def on_resize(self, event):
        new_column_count = (
            self.calculate_column_count()
        )

        if (
            new_column_count
            != self.current_column_count
        ):
            self.layout_cards()