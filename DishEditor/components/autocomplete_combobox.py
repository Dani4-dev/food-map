import tkinter as tk
from tkinter import ttk


class AutocompleteCombobox(ttk.Frame):
    def __init__(
        self,
        parent,
        values=None,
        **kwargs,
    ):
        super().__init__(parent)

        self.all_values = list(values or [])
        self.filtered_values = []

        self.variable = tk.StringVar()

        self.columnconfigure(0, weight=1)

        self.entry = ttk.Entry(
            self,
            textvariable=self.variable,
            **kwargs,
        )

        self.entry.grid(
            row=0,
            column=0,
            sticky="ew",
        )

        self.dropdown_button = ttk.Button(
            self,
            text="▼",
            width=3,
            command=self.toggle_dropdown,
        )

        self.dropdown_button.grid(
            row=0,
            column=1,
            padx=(2, 0),
        )

        # Отдельное окно для подсказок
        self.popup = tk.Toplevel(self)
        self.popup.withdraw()
        self.popup.overrideredirect(True)

        self.listbox = tk.Listbox(
            self.popup,
            height=8,
            exportselection=False,
        )

        self.listbox.pack(
            fill="both",
            expand=True,
        )

        self.entry.bind(
            "<KeyRelease>",
            self.on_key_release,
        )

        self.entry.bind(
            "<Down>",
            self.on_down,
        )

        self.entry.bind(
            "<Up>",
            self.on_up,
        )

        self.entry.bind(
            "<Return>",
            self.on_enter,
        )

        self.entry.bind(
            "<Escape>",
            lambda event: self.hide_popup(),
        )

        self.listbox.bind(
            "<ButtonRelease-1>",
            self.on_mouse_select,
        )

    # --------------------------------
    # Public methods
    # --------------------------------

    def get(self):
        return self.variable.get()

    def set(self, value):
        self.variable.set(value)

    def set_values(self, values):
        self.all_values = list(values)
        self.filtered_values = []

        self.hide_popup()

    def focus_set(self):
        self.entry.focus_set()

    # --------------------------------
    # Search
    # --------------------------------

    def on_key_release(self, event):
        if event.keysym in (
            "Up",
            "Down",
            "Return",
            "Escape",
            "Tab",
        ):
            return

        text = self.get().strip().lower()

        if not text:
            self.hide_popup()
            return

        self.filtered_values = [
            value
            for value in self.all_values
            if value.lower().startswith(text)
        ]

        if not self.filtered_values:
            self.hide_popup()
            return

        self.show_popup()

    # --------------------------------
    # Popup
    # --------------------------------

    def show_popup(self):
        self.listbox.delete(
            0,
            tk.END,
        )

        for value in self.filtered_values:
            self.listbox.insert(
                tk.END,
                value,
            )

        self.update_idletasks()

        x = self.winfo_rootx()
        y = (
            self.winfo_rooty()
            + self.winfo_height()
        )

        width = self.winfo_width()

        visible_rows = min(
            len(self.filtered_values),
            8,
        )

        row_height = 22

        height = max(
            visible_rows * row_height,
            row_height,
        )

        self.popup.geometry(
            f"{width}x{height}+{x}+{y}"
        )

        self.popup.deiconify()
        self.popup.lift()

        # ВАЖНО:
        # фокус остаётся в Entry.
        self.entry.focus_set()

    def hide_popup(self):
        self.popup.withdraw()

    # --------------------------------
    # Keyboard navigation
    # --------------------------------

    def on_down(self, event):
        if not self.filtered_values:
            return "break"

        if not self.popup.winfo_viewable():
            self.show_popup()

        selection = self.listbox.curselection()

        if not selection:
            index = 0
        else:
            index = min(
                selection[0] + 1,
                self.listbox.size() - 1,
            )

        self.select_listbox_index(index)

        return "break"

    def on_up(self, event):
        selection = self.listbox.curselection()

        if not selection:
            return "break"

        index = max(
            selection[0] - 1,
            0,
        )

        self.select_listbox_index(index)

        return "break"

    def select_listbox_index(
        self,
        index,
    ):
        self.listbox.selection_clear(
            0,
            tk.END,
        )

        self.listbox.selection_set(
            index,
        )

        self.listbox.see(index)

    # --------------------------------
    # Selection
    # --------------------------------

    def on_enter(self, event):
        selection = self.listbox.curselection()

        if selection:
            value = self.listbox.get(
                selection[0]
            )

            self.select_value(value)

        elif len(self.filtered_values) == 1:
            self.select_value(
                self.filtered_values[0]
            )

        return "break"

    def on_mouse_select(self, event):
        selection = self.listbox.curselection()

        if not selection:
            return

        value = self.listbox.get(
            selection[0]
        )

        self.select_value(value)

    def select_value(self, value):
        self.set(value)

        self.hide_popup()

        self.entry.icursor(
            tk.END,
        )

        self.entry.focus_set()

        # Для существующего кода:
        self.event_generate(
            "<<ComboboxSelected>>"
        )

    def toggle_dropdown(self):
        if self.popup.winfo_viewable():
            self.hide_popup()
            return

        if not self.all_values:
            return

        # При нажатии на стрелку показываем весь список
        self.filtered_values = self.all_values.copy()

        self.show_popup()

        # Возвращаем курсор в поле ввода
        self.entry.focus_set()