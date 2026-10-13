from tkinter import ttk

from components.dish_form import DishForm


class CreateDishView(ttk.Frame):
    def __init__(self, parent):
        super().__init__(parent)

        ttk.Label(
            self,
            text="Create dish",
            font=("Arial", 20, "bold"),
        ).pack(
            anchor="w",
            pady=(0, 20),
        )

        dish_form = DishForm(self)

        dish_form.pack(
            fill="both",
            expand=True,
        )