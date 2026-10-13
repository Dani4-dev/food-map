import json

from pathlib import Path
from tkinter import messagebox, ttk

from countries import COUNTRIES


class DishDetailsView(ttk.Frame):
    def __init__(
        self,
        parent,
        json_path: Path,
        on_back=None,
    ):
        super().__init__(parent)

        self.json_path = Path(json_path)
        self.on_back = on_back

        self.dish = self.load_dish()

        if self.dish:
            self.create_widgets()

    def load_dish(self):
        try:
            with open(
                self.json_path,
                "r",
                encoding="utf-8",
            ) as file:
                return json.load(file)

        except (
            OSError,
            json.JSONDecodeError,
        ) as error:
            messagebox.showerror(
                "Error",
                f"Could not load dish:\n{error}",
            )

            return None

    def get_country_name(
        self,
        country_code: str,
    ) -> str:
        for name, code in COUNTRIES.items():
            if code == country_code:
                return name

        return country_code

    def create_widgets(self):
        dish = self.dish

        # -------------------------
        # Header
        # -------------------------

        header = ttk.Frame(self)
        header.pack(
            fill="x",
            pady=(0, 20),
        )

        if self.on_back:
            ttk.Button(
                header,
                text="← Back",
                command=self.on_back,
            ).pack(
                side="left",
                padx=(0, 15),
            )

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

        title = (
            name_en
            or name_ja
            or "Unnamed dish"
        )

        ttk.Label(
            header,
            text=title,
            font=("Arial", 22, "bold"),
        ).pack(
            side="left",
        )

        # -------------------------
        # General information
        # -------------------------

        origin = dish.get(
            "origin",
            {},
        )

        general = ttk.LabelFrame(
            self,
            text="General Information",
            padding=15,
        )

        general.pack(
            fill="x",
            pady=(0, 15),
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

        self.add_info_row(
            general,
            0,
            "Country:",
            country_name,
        )

        self.add_info_row(
            general,
            1,
            "Region:",
            origin.get("region", "—"),
        )

        self.add_info_row(
            general,
            2,
            "City:",
            origin.get("city", "—"),
        )

        self.add_info_row(
            general,
            3,
            "ID:",
            dish.get("id", "—"),
        )

        # -------------------------
        # Languages
        # -------------------------

        language_frame = ttk.Frame(self)

        language_frame.pack(
            fill="both",
            expand=True,
        )

        language_frame.columnconfigure(
            0,
            weight=1,
        )

        language_frame.columnconfigure(
            1,
            weight=1,
        )

        # English
        en_frame = ttk.LabelFrame(
            language_frame,
            text="English",
            padding=15,
        )

        en_frame.grid(
            row=0,
            column=0,
            sticky="nsew",
            padx=(0, 8),
        )

        self.create_language_section(
            en_frame,
            language="en",
        )

        # Japanese
        ja_frame = ttk.LabelFrame(
            language_frame,
            text="日本語",
            padding=15,
        )

        ja_frame.grid(
            row=0,
            column=1,
            sticky="nsew",
            padx=(8, 0),
        )

        self.create_language_section(
            ja_frame,
            language="ja",
        )

    def add_info_row(
        self,
        parent,
        row: int,
        label: str,
        value: str,
    ):
        ttk.Label(
            parent,
            text=label,
            font=("Arial", 10, "bold"),
        ).grid(
            row=row,
            column=0,
            sticky="nw",
            padx=(0, 10),
            pady=3,
        )

        ttk.Label(
            parent,
            text=value or "—",
        ).grid(
            row=row,
            column=1,
            sticky="nw",
            pady=3,
        )

    def create_language_section(
        self,
        parent,
        language: str,
    ):
        dish = self.dish

        names = dish.get(
            "name",
            {},
        )

        description = dish.get(
            "description",
            {},
        )

        recipe = dish.get(
            "recipe",
            {},
        )

        ingredients = recipe.get(
            "ingredients",
            {},
        )

        preparation = recipe.get(
            "preparation",
            {},
        )

        self.add_text_section(
            parent,
            "Name",
            names.get(language, ""),
        )

        self.add_text_section(
            parent,
            "Description",
            description.get(language, ""),
        )

        self.add_text_section(
            parent,
            "Ingredients",
            ingredients.get(language, ""),
        )

        self.add_text_section(
            parent,
            "Preparation",
            preparation.get(language, ""),
        )

    def add_text_section(
        self,
        parent,
        title: str,
        text: str,
    ):
        ttk.Label(
            parent,
            text=title,
            font=("Arial", 11, "bold"),
        ).pack(
            anchor="w",
            pady=(0, 4),
        )

        ttk.Label(
            parent,
            text=text or "—",
            wraplength=350,
            justify="left",
        ).pack(
            anchor="w",
            fill="x",
            pady=(0, 15),
        )