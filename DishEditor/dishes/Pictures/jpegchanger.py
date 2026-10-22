"""Rename image extensions to .jpg in this script's folder and subfolders.

Only filenames change; image contents and JSON references remain unchanged.
"""

from pathlib import Path


IMAGE_EXTENSIONS = {
    ".jpeg", ".jpg", ".jfif", ".png", ".webp", ".gif",
    ".bmp", ".tif", ".tiff", ".avif", ".heic", ".heif",
    ".ico", ".svg",
}


def rename_images(folder: Path) -> tuple[int, int]:
    """Rename images recursively, skipping existing destinations and errors."""
    renamed = 0
    skipped = 0

    for source in sorted(folder.rglob("*")):
        if not source.is_file() or source.suffix.lower() not in IMAGE_EXTENSIONS:
            continue
        if source.suffix == ".jpg":
            continue

        destination = source.with_suffix(".jpg")
        try:
            # On Windows a case-only rename may refer to the same file.
            if destination.exists() and not source.samefile(destination):
                print(f"Пропущено (файл уже существует): {source}")
                skipped += 1
                continue

            source.rename(destination)
            renamed += 1
            print(f"{source.relative_to(folder)} -> {destination.relative_to(folder)}")
        except OSError as error:
            skipped += 1
            print(f"Не удалось переименовать {source}: {error}")

    return renamed, skipped


if __name__ == "__main__":
    root = Path(__file__).resolve().parent
    renamed, skipped = rename_images(root)
    print(f"Готово. Переименовано: {renamed}. Пропущено: {skipped}.")
