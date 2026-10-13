import json
import re
import shutil
import tkinter as tk
import uuid

from pathlib import Path
from tkinter import filedialog, messagebox, ttk

from countries import COUNTRIES
from datetime import datetime, timezone
from services.location_service import LocationService
from components.autocomplete_combobox import AutocompleteCombobox
from services.app_paths import get_dishes_directory

class DishForm(ttk.Frame):
    def __init__(
        self,
        parent,
        json_path: Path | None = None,
        on_saved=None,
    ):
        super().__init__(parent)

        self.json_path = Path(json_path) if json_path else None
        self.on_saved = on_saved

        self.original_dish = {}
        self.selected_image_path: Path | None = None
        self.location_service = LocationService()

        self.create_widgets()

        if self.json_path:
            self.load_dish()

    def create_widgets(self):
        self.columnconfigure(0, weight=1)
        self.columnconfigure(1, weight=1)

        # -------------------------
        # General information
        # -------------------------

        general_frame = ttk.LabelFrame(
            self,
            text="General Information",
            padding=15,
        )

        general_frame.grid(
            row=0,
            column=0,
            columnspan=2,
            sticky="ew",
            pady=(0, 20),
        )

        general_frame.columnconfigure(1, weight=1)

        # Country
        ttk.Label(
            general_frame,
            text="Country:",
        ).grid(
            row=0,
            column=0,
            sticky="w",
            padx=(0, 10),
            pady=5,
        )

        self.country = AutocompleteCombobox(
            general_frame,
            values=sorted(COUNTRIES.keys()),
        )

        self.country.grid(
            row=0,
            column=1,
            sticky="ew",
            pady=5,
        )

        self.country.bind(
            "<<ComboboxSelected>>",
            self.on_country_changed,
        )

        self.country.bind(
            "<Return>",
            self.on_country_changed,
        )

        # Region
        ttk.Label(
            general_frame,
            text="Region:",
        ).grid(
            row=1,
            column=0,
            sticky="w",
            padx=(0, 10),
            pady=5,
        )

        self.region = AutocompleteCombobox(
            general_frame,
        )

        self.region.grid(
            row=1,
            column=1,
            sticky="ew",
            pady=5,
        )

        # City
        ttk.Label(
            general_frame,
            text="City:",
        ).grid(
            row=2,
            column=0,
            sticky="w",
            padx=(0, 10),
            pady=5,
        )

        self.city = AutocompleteCombobox(
            general_frame,
        )

        self.city.grid(
            row=2,
            column=1,
            sticky="ew",
            pady=5,
        )

        self.city.grid(
            row=2,
            column=1,
            sticky="ew",
            pady=5,
        )

        # Image
        ttk.Label(
            general_frame,
            text="Image:",
        ).grid(
            row=3,
            column=0,
            sticky="w",
            padx=(0, 10),
            pady=5,
        )

        image_frame = ttk.Frame(general_frame)

        image_frame.grid(
            row=3,
            column=1,
            sticky="ew",
            pady=5,
        )

        image_frame.columnconfigure(0, weight=1)

        self.image_path_label = ttk.Label(
            image_frame,
            text="No image selected",
        )

        self.image_path_label.grid(
            row=0,
            column=0,
            sticky="w",
        )

        ttk.Button(
            image_frame,
            text="Choose Image",
            command=self.choose_image,
        ).grid(
            row=0,
            column=1,
            padx=(10, 0),
        )

        # -------------------------
        # English
        # -------------------------

        en_frame = ttk.LabelFrame(
            self,
            text="English",
            padding=15,
        )

        en_frame.grid(
            row=1,
            column=0,
            sticky="nsew",
            padx=(0, 10),
        )

        en_frame.columnconfigure(0, weight=1)

        ttk.Label(en_frame, text="Name:").grid(
            row=0,
            column=0,
            sticky="w",
        )

        self.name_en = ttk.Entry(en_frame)

        self.name_en.grid(
            row=1,
            column=0,
            sticky="ew",
            pady=(3, 12),
        )

        ttk.Label(en_frame, text="Description:").grid(
            row=2,
            column=0,
            sticky="w",
        )

        self.description_en = tk.Text(
            en_frame,
            height=5,
            wrap="word",
        )

        self.description_en.grid(
            row=3,
            column=0,
            sticky="ew",
            pady=(3, 12),
        )

        ttk.Label(en_frame, text="Ingredients:").grid(
            row=4,
            column=0,
            sticky="w",
        )

        self.ingredients_en = tk.Text(
            en_frame,
            height=6,
            wrap="word",
        )

        self.ingredients_en.grid(
            row=5,
            column=0,
            sticky="ew",
            pady=(3, 12),
        )

        ttk.Label(en_frame, text="Preparation:").grid(
            row=6,
            column=0,
            sticky="w",
        )

        self.preparation_en = tk.Text(
            en_frame,
            height=7,
            wrap="word",
        )

        self.preparation_en.grid(
            row=7,
            column=0,
            sticky="ew",
        )

        # -------------------------
        # Japanese
        # -------------------------

        ja_frame = ttk.LabelFrame(
            self,
            text="日本語",
            padding=15,
        )

        ja_frame.grid(
            row=1,
            column=1,
            sticky="nsew",
            padx=(10, 0),
        )

        ja_frame.columnconfigure(0, weight=1)

        ttk.Label(ja_frame, text="料理名:").grid(
            row=0,
            column=0,
            sticky="w",
        )

        self.name_ja = ttk.Entry(ja_frame)

        self.name_ja.grid(
            row=1,
            column=0,
            sticky="ew",
            pady=(3, 12),
        )

        ttk.Label(ja_frame, text="説明:").grid(
            row=2,
            column=0,
            sticky="w",
        )

        self.description_ja = tk.Text(
            ja_frame,
            height=5,
            wrap="word",
        )

        self.description_ja.grid(
            row=3,
            column=0,
            sticky="ew",
            pady=(3, 12),
        )

        ttk.Label(ja_frame, text="材料:").grid(
            row=4,
            column=0,
            sticky="w",
        )

        self.ingredients_ja = tk.Text(
            ja_frame,
            height=6,
            wrap="word",
        )

        self.ingredients_ja.grid(
            row=5,
            column=0,
            sticky="ew",
            pady=(3, 12),
        )

        ttk.Label(ja_frame, text="作り方:").grid(
            row=6,
            column=0,
            sticky="w",
        )

        self.preparation_ja = tk.Text(
            ja_frame,
            height=7,
            wrap="word",
        )

        self.preparation_ja.grid(
            row=7,
            column=0,
            sticky="ew",
        )

        # -------------------------
        # Save
        # -------------------------

        self.save_button = ttk.Button(
            self,
            text="Save JSON",
            command=self.save_json,
        )

        self.save_button.grid(
            row=2,
            column=0,
            columnspan=2,
            pady=20,
        )

    def choose_image(self):
        file_path = filedialog.askopenfilename(
            title="Choose dish image",
            filetypes=[
                ("Image files", "*.png *.jpg *.jpeg *.webp"),
            ],
        )

        if not file_path:
            return

        self.selected_image_path = Path(file_path)

        self.image_path_label.config(
            text=self.selected_image_path.name,
        )

    def get_text(self, widget: tk.Text) -> str:
        return widget.get("1.0", "end").strip()

    def create_slug(self, text: str) -> str:
        slug = text.strip().lower()
        slug = re.sub(r"[^a-z0-9]+", "-", slug)
        slug = slug.strip("-")

        if not slug:
            slug = str(uuid.uuid4())

        return slug

    def save_json(self):
        country_name = self.country.get().strip()

        name_en = self.name_en.get().strip()
        name_ja = self.name_ja.get().strip()

        if not country_name:
            messagebox.showerror(
                "Error",
                "Please select a country.",
            )
            return

        if not name_en and not name_ja:
            messagebox.showerror(
                "Error",
                "Please enter at least one dish name.",
            )
            return

        country_code = COUNTRIES[country_name]

        now = datetime.now(
            timezone.utc
        ).isoformat()

        # -------------------------
        # ID + dates
        # -------------------------

        if self.original_dish:
            dish_id = self.original_dish.get(
                "id",
                str(uuid.uuid4()),
            )

            created_at = self.original_dish.get(
                "createdAt",
                now,
            )
        else:
            dish_id = str(uuid.uuid4())
            created_at = now

        dish = {
            "id": dish_id,
            "createdAt": created_at,
            "name": {},
            "origin": {
                "country": country_code,
            },
        }

        if self.original_dish:
            dish["updatedAt"] = now

        # -------------------------
        # Names
        # -------------------------

        if name_en:
            dish["name"]["en"] = name_en

        if name_ja:
            dish["name"]["ja"] = name_ja

        # -------------------------
        # Origin
        # -------------------------

        region = self.region.get().strip()
        city = self.city.get().strip()

        if region:
            dish["origin"]["region"] = region

        if city:
            dish["origin"]["city"] = city

        # -------------------------
        # Description
        # -------------------------

        description = {}

        description_en = self.get_text(
            self.description_en
        )

        description_ja = self.get_text(
            self.description_ja
        )

        if description_en:
            description["en"] = description_en

        if description_ja:
            description["ja"] = description_ja

        if description:
            dish["description"] = description

        # -------------------------
        # Recipe
        # -------------------------

        ingredients = {}
        preparation = {}

        ingredients_en = self.get_text(
            self.ingredients_en
        )

        ingredients_ja = self.get_text(
            self.ingredients_ja
        )

        preparation_en = self.get_text(
            self.preparation_en
        )

        preparation_ja = self.get_text(
            self.preparation_ja
        )

        if ingredients_en:
            ingredients["en"] = ingredients_en

        if ingredients_ja:
            ingredients["ja"] = ingredients_ja

        if preparation_en:
            preparation["en"] = preparation_en

        if preparation_ja:
            preparation["ja"] = preparation_ja

        recipe = {}

        if ingredients:
            recipe["ingredients"] = ingredients

        if preparation:
            recipe["preparation"] = preparation

        if recipe:
            dish["recipe"] = recipe

        # -------------------------
        # Directories
        # -------------------------

        dishes_directory = get_dishes_directory()

        country_directory = (
            dishes_directory / country_name
        )

        country_directory.mkdir(
            parents=True,
            exist_ok=True,
        )

        # -------------------------
        # Image
        # -------------------------

        if self.selected_image_path:
            pictures_directory = (
                dishes_directory / "Pictures"
            )

            pictures_directory.mkdir(
                parents=True,
                exist_ok=True,
            )

            dish_name = name_en or name_ja

            image_name = self.create_image_filename(
                dish_name,
                self.selected_image_path,
            )

            destination = (
                pictures_directory
                / image_name
            )

            if (
                self.selected_image_path.resolve()
                != destination.resolve()
            ):
                shutil.copy2(
                    self.selected_image_path,
                    destination,
                )

            dish["image"] = (
                f"Pictures/{image_name}"
            )

        elif self.original_dish.get("image"):
            dish["image"] = (
                self.original_dish["image"]
            )

        # -------------------------
        # JSON path
        # -------------------------

        old_path = self.json_path

        if old_path:
            # Editing:
            # keep existing filename.
            json_path = (
                country_directory
                / old_path.name
            )

            # If moved to another country and same
            # filename already exists.
            if (
                json_path.exists()
                and json_path.resolve()
                != old_path.resolve()
            ):
                stem = json_path.stem
                suffix = json_path.suffix

                counter = 2

                while json_path.exists():
                    json_path = (
                        country_directory
                        / f"{stem}-{counter}{suffix}"
                    )

                    counter += 1

        else:
            # Creating a new dish.
            if name_en:
                slug = self.create_slug(
                    name_en
                )
            else:
                slug = str(uuid.uuid4())

            json_path = (
                country_directory
                / f"{slug}.json"
            )

            counter = 2

            while json_path.exists():
                json_path = (
                    country_directory
                    / f"{slug}-{counter}.json"
                )

                counter += 1

        # -------------------------
        # Save
        # -------------------------

        try:
            with open(
                json_path,
                "w",
                encoding="utf-8",
            ) as file:
                json.dump(
                    dish,
                    file,
                    ensure_ascii=False,
                    indent=2,
                )

        except OSError as error:
            messagebox.showerror(
                "Error",
                f"Could not save dish:\n{error}",
            )
            return

        # If country changed, remove old file.
        if (
            old_path
            and old_path.exists()
            and old_path.resolve()
            != json_path.resolve()
        ):
            try:
                old_path.unlink()
            except OSError:
                pass

        self.json_path = json_path
        self.original_dish = dish

        messagebox.showinfo(
            "Saved",
            f"Dish saved:\n{json_path}",
        )

        # Edit → return to list.
        if self.on_saved:
            self.on_saved()

        # Create → clear form.
        elif not old_path:
            self.clear_form()

    def clear_form(self):
        # General information
        self.country.set("")

        self.region.set("")
        self.city.set("")

        self.region.set_values([])
        self.city.set_values([])

        # English
        self.name_en.delete(0, "end")
        self.description_en.delete("1.0", "end")
        self.ingredients_en.delete("1.0", "end")
        self.preparation_en.delete("1.0", "end")

        # Japanese
        self.name_ja.delete(0, "end")
        self.description_ja.delete("1.0", "end")
        self.ingredients_ja.delete("1.0", "end")
        self.preparation_ja.delete("1.0", "end")

        # Image
        self.selected_image_path = None

        self.image_path_label.config(
            text="No image selected"
        )

    def set_text(
        self,
        widget: tk.Text,
        value: str,
    ):
        widget.delete("1.0", "end")
        widget.insert("1.0", value)


    def load_dish(self):
        try:
            with open(
                self.json_path,
                "r",
                encoding="utf-8",
            ) as file:
                dish = json.load(file)

        except (
            OSError,
            json.JSONDecodeError,
        ) as error:
            messagebox.showerror(
                "Error",
                f"Could not load dish:\n{error}",
            )
            return

        self.original_dish = dish

        # -------------------------
        # Name
        # -------------------------

        names = dish.get("name", {})

        self.name_en.delete(0, "end")
        self.name_en.insert(
            0,
            names.get("en", ""),
        )

        self.name_ja.delete(0, "end")
        self.name_ja.insert(
            0,
            names.get("ja", ""),
        )

        # -------------------------
        # Origin
        # -------------------------

        origin = dish.get("origin", {})

        country_code = origin.get(
            "country",
            "",
        )

        country_name = next(
            (
                name
                for name, code in COUNTRIES.items()
                if code == country_code
            ),
            "",
        )

        self.country.set(country_name)
        self.on_country_changed()

        self.region.set(
            origin.get("region", "")
        )

        self.city.set(
            origin.get("city", "")
        )

        # -------------------------
        # Description
        # -------------------------

        description = dish.get(
            "description",
            {},
        )

        self.set_text(
            self.description_en,
            description.get("en", ""),
        )

        self.set_text(
            self.description_ja,
            description.get("ja", ""),
        )

        # -------------------------
        # Recipe
        # -------------------------

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

        self.set_text(
            self.ingredients_en,
            ingredients.get("en", ""),
        )

        self.set_text(
            self.ingredients_ja,
            ingredients.get("ja", ""),
        )

        self.set_text(
            self.preparation_en,
            preparation.get("en", ""),
        )

        self.set_text(
            self.preparation_ja,
            preparation.get("ja", ""),
        )

        # -------------------------
        # Image
        # -------------------------

        image = dish.get("image")

        if image:
            image_path = (
                get_dishes_directory()
                / image
            )

            if image_path.exists():
                self.selected_image_path = image_path

            self.image_path_label.config(
                text=Path(image).name,
            )

        # Edit mode
        self.save_button.config(
            text="Save Changes",
        )

    def on_country_changed(self, event=None):
        country_name = self.country.get().strip()

        if not country_name:
            self.region["values"] = []
            self.city["values"] = []

            self.region.set("")
            self.city.set("")

            return

        country_code = COUNTRIES[
            country_name
        ]

        regions = (
            self.location_service
            .get_regions(country_code)
        )

        cities = (
            self.location_service
            .get_cities(country_code)
        )

        self.region.set_values(regions)
        self.city.set_values(cities)

        self.region.set("")
        self.city.set("")

        self.region.set("")
        self.city.set("")

    def create_image_filename(
        self,
        dish_name: str,
        original_path: Path,
    ) -> str:
        # Удаляем символы, запрещённые Windows
        safe_name = re.sub(
            r'[<>:"/\\|?*]',
            "",
            dish_name.strip(),
        )

        # Windows также не любит точку/пробел в конце
        safe_name = safe_name.rstrip(". ")

        if not safe_name:
            safe_name = str(uuid.uuid4())

        extension = original_path.suffix.lower()

        return f"{safe_name}{extension}"