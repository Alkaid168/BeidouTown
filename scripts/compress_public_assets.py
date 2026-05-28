from pathlib import Path
from PIL import Image

ROOT = Path(r"f:/CODES/北斗镇/public")

BACKGROUND_TARGETS = [
    (ROOT / "home-background.png", ROOT / "home-background.jpg", 1800, 82),
    (ROOT / "auth-background.png", ROOT / "auth-background.jpg", 1800, 82),
    (ROOT / "treehole-background.png", ROOT / "treehole-background.jpg", 1800, 80),
    (ROOT / "treehole-compose-background.png", ROOT / "treehole-compose-background.jpg", 1800, 80),
    (ROOT / "treehole-letter-background.png", ROOT / "treehole-letter-background.jpg", 1800, 80),
    (ROOT / "temple-background.png", ROOT / "temple-background.jpg", 1800, 80),
    (ROOT / "temple-reading-background.png", ROOT / "temple-reading-background.jpg", 1800, 80),
]

TAROT_DIR = ROOT / "tarot"


def save_jpeg(source: Path, target: Path, max_width: int, quality: int) -> None:
    with Image.open(source) as image:
        image = image.convert("RGB")
        if image.width > max_width:
            ratio = max_width / image.width
            image = image.resize((max_width, int(image.height * ratio)), Image.LANCZOS)
        image.save(target, format="JPEG", quality=quality, optimize=True, progressive=True)


def save_webp(source: Path, target: Path, max_width: int, quality: int) -> None:
    with Image.open(source) as image:
        image = image.convert("RGB")
        if image.width > max_width:
            ratio = max_width / image.width
            image = image.resize((max_width, int(image.height * ratio)), Image.LANCZOS)
        image.save(target, format="WEBP", quality=quality, method=6)


for source, target, max_width, quality in BACKGROUND_TARGETS:
    if source.exists():
        save_jpeg(source, target, max_width, quality)
        print(f"background -> {target.name}")

for source in TAROT_DIR.glob("*.png"):
    target = source.with_suffix('.webp')
    save_webp(source, target, 900, 78)
    print(f"tarot -> {target.name}")
