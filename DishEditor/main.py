import tkinter as tk
from tkinter import ttk

from views.create_dish import CreateDishView
from views.dish_list import DishListView
from views.dish_details import DishDetailsView
from views.edit_dish import EditDishView
from services.app_paths import ensure_app_directories


class DishEditorApp:
    def __init__(self, root: tk.Tk):
        self.root = root

        self.root.title("Dish Editor")
        screen_width = self.root.winfo_screenwidth()
        screen_height = self.root.winfo_screenheight()

        window_width = min(1100, screen_width - 80)
        window_height = min(700, screen_height - 140)

        x = max((screen_width - window_width) // 2, 0)
        y = 20

        self.root.geometry(
            f"{window_width}x{window_height}+{x}+{y}"
        )

        self.root.minsize(850, 550)

        self.create_layout()
        self.show_create_dish()

    def create_layout(self):
        # Sidebar
        sidebar = ttk.Frame(
            self.root,
            padding=15,
        )
        sidebar.pack(
            side="left",
            fill="y",
        )

        ttk.Label(
            sidebar,
            text="Dish Editor",
            font=("Arial", 18, "bold"),
        ).pack(
            pady=(0, 25),
        )

        ttk.Button(
            sidebar,
            text="Create dish",
            command=self.show_create_dish,
        ).pack(
            fill="x",
            pady=5,
        )

        ttk.Button(
            sidebar,
            text="Dish list",
            command=self.show_dish_list,
        ).pack(
            fill="x",
            pady=5,
        )

        ttk.Separator(
            self.root,
            orient="vertical",
        ).pack(
            side="left",
            fill="y",
        )

        # Main content
        content_container = ttk.Frame(self.root)
        content_container.pack(
            side="left",
            fill="both",
            expand=True,
        )

        canvas = tk.Canvas(
            content_container,
            highlightthickness=0,
        )

        scrollbar = ttk.Scrollbar(
            content_container,
            orient="vertical",
            command=canvas.yview,
        )

        canvas.configure(
            yscrollcommand=scrollbar.set,
        )

        scrollbar.pack(
            side="right",
            fill="y",
        )

        canvas.pack(
            side="left",
            fill="both",
            expand=True,
        )

        self.content = ttk.Frame(
            canvas,
            padding=20,
        )

        content_window = canvas.create_window(
            (0, 0),
            window=self.content,
            anchor="nw",
        )

        def update_scroll_region(event=None):
            canvas.configure(
                scrollregion=canvas.bbox("all")
            )


        def resize_content(event):
            canvas.itemconfigure(
                content_window,
                width=event.width,
            )


        self.content.bind(
            "<Configure>",
            update_scroll_region,
        )

        canvas.bind(
            "<Configure>",
            resize_content,
        )

        def on_mousewheel(event):
            widget = event.widget

            # У выпадающего списка Combobox Tkinter иногда
            # передаёт внутреннее имя виджета как строку.
            # В этом случае основное окно прокручивать не надо.
            if not hasattr(widget, "winfo_class"):
                return "break"

            widget_class = widget.winfo_class()

            # Не прокручивать основное окно,
            # если колесо используется внутри Combobox/Listbox.
            if widget_class in (
                "TCombobox",
                "Combobox",
                "Listbox",
            ):
                return "break"

            canvas.yview_scroll(
                int(-1 * (event.delta / 120)),
                "units",
            )


        canvas.bind_all(
            "<MouseWheel>",
            on_mousewheel,
        )

    def clear_content(self):
        for widget in self.content.winfo_children():
            widget.destroy()

    def show_create_dish(self):
        self.clear_content()

        view = CreateDishView(
            self.content,
        )

        view.pack(
            fill="both",
            expand=True,
        )

    def show_dish_list(self):

        self.clear_content()

        view = DishListView(
            self.content,
            on_view=self.show_dish_details,
            on_edit=self.show_edit_dish,
        )

        view.pack(
            fill="both",
            expand=True,
        )

    def show_dish_details(self, json_path):
        self.clear_content()

        view = DishDetailsView(
            self.content,
            json_path=json_path,
            on_back=self.show_dish_list,
        )

        view.pack(
            fill="both",
            expand=True,
        )


    def show_edit_dish(self, json_path):
        self.clear_content()

        view = EditDishView(
            self.content,
            json_path=json_path,
            on_back=self.show_dish_list,
        )

        view.pack(
            fill="both",
            expand=True,
        )


def main():
    ensure_app_directories()

    root = tk.Tk()

    DishEditorApp(root)

    root.mainloop()


if __name__ == "__main__":
    main()