import sys
from pathlib import Path


def get_app_directory() -> Path:
    if getattr(sys, "frozen", False):
        return Path(sys.executable).resolve().parent

    return Path(__file__).resolve().parent.parent


def get_dishes_directory() -> Path:
    return get_app_directory() / "dishes"


def ensure_app_directories():
    dishes_directory = get_dishes_directory()
    pictures_directory = dishes_directory / "Pictures"

    dishes_directory.mkdir(
        parents=True,
        exist_ok=True,
    )

    pictures_directory.mkdir(
        parents=True,
        exist_ok=True,
    )