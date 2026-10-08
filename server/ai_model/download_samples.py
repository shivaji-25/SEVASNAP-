import os
import requests
import sys

# Ensure UTF-8 output on Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

DATASET_ROOT = os.path.dirname(os.path.abspath(__file__))

# Curated image sources for the 5 civic problem classes
SAMPLE_IMAGES = {
    "pothole": [
        "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&q=80",
        "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&q=80",
        "https://images.unsplash.com/photo-1599818816942-88849c7e07e8?w=600&q=80",
        "https://images.unsplash.com/photo-1578885136359-16c8bd4d3a8e?w=600&q=80",
    ],
    "garbage": [
        "https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?w=600&q=80",
        "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=600&q=80",
        "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=600&q=80",
        "https://images.unsplash.com/photo-1567095761054-7a02e69e5c43?w=600&q=80",
    ],
    "water_leak": [
        "https://images.unsplash.com/photo-1584467735815-f778f274e296?w=600&q=80",
        "https://images.unsplash.com/photo-1520690214124-2405c5217036?w=600&q=80",
        "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&q=80",
        "https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=600&q=80",
    ],
    "streetlight": [
        "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&q=80",
        "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=600&q=80",
        "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&q=80",
        "https://images.unsplash.com/photo-1498084393753-b411b2d26b34?w=600&q=80",
    ],
    "drainage": [
        "https://images.unsplash.com/photo-1574482620826-40685ca5ebd2?w=600&q=80",
        "https://images.unsplash.com/photo-1547683905-f686c993aae5?w=600&q=80",
        "https://images.unsplash.com/photo-1519692933481-e162a57d6721?w=600&q=80",
        "https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=600&q=80",
    ],
}

def download_image(url, save_path):
    try:
        headers = {"User-Agent": "Mozilla/5.0"}
        res = requests.get(url, headers=headers, timeout=10)
        if res.status_code == 200:
            with open(save_path, "wb") as f:
                f.write(res.content)
            return True
    except Exception as e:
        print(f"  Warning downloading {url}: {e}")
    return False

def main():
    print("[*] Downloading Training & Validation Dataset for SEVASNAP...")
    total_downloaded = 0

    for category, urls in SAMPLE_IMAGES.items():
        print(f"\n[+] Processing category: {category}...")
        train_dir = os.path.join(DATASET_ROOT, "dataset", "train", category)
        val_dir = os.path.join(DATASET_ROOT, "dataset", "val", category)
        os.makedirs(train_dir, exist_ok=True)
        os.makedirs(val_dir, exist_ok=True)

        for i, url in enumerate(urls):
            target_dir = val_dir if i == len(urls) - 1 else train_dir
            filename = f"{category}_{i + 1}.jpg"
            filepath = os.path.join(target_dir, filename)

            if not os.path.exists(filepath):
                print(f"  -> Downloading {filename} to {os.path.basename(target_dir)}...")
                if download_image(url, filepath):
                    total_downloaded += 1
            else:
                print(f"  [OK] {filename} already exists")

    print(f"\n[SUCCESS] Dataset prepared! {total_downloaded} new images downloaded.")
    print("Train directory:", os.path.join(DATASET_ROOT, "dataset", "train"))
    print("Val directory:", os.path.join(DATASET_ROOT, "dataset", "val"))

if __name__ == "__main__":
    main()
