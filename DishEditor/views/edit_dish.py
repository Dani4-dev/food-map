from pathlib import Path
from tkinter import ttk

from components.dish_form import DishForm


class EditDishView(ttk.Frame):
    def __init__(
        self,
        parent,
        json_path: Path,
        on_back=None,
    ):
        super().__init__(parent)

        header = ttk.Frame(self)
        header.pack(
            fill="x",
            pady=(0, 20),
        )

        if on_back:
            ttk.Button(
                header,
                text="← Back",
                command=on_back,
            ).pack(
                side="left",
                padx=(0, 15),
            )

        ttk.Label(
            header,
            text="Edit dish",
            font=("Arial", 20, "bold"),
        ).pack(
            side="left",
        )

        form = DishForm(
            self,
            json_path=json_path,
            on_saved=on_back,
        )

        form.pack(
            fill="both",
            expand=True,
        )