import os
import sys
import json
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms, models
from PIL import Image

# Ensure UTF-8 output on Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, "dataset")
MODEL_SAVE_PATH = os.path.join(BASE_DIR, "civic_classifier.pth")
CLASSES_SAVE_PATH = os.path.join(BASE_DIR, "classes.json")

# Metadata mapping for the 5 civic classes
CLASS_METADATA = {
    "pothole": {
        "categoryName": "Pothole",
        "severity": "High",
        "department": "Roads & Infrastructure Department",
        "sla": "Under 4 hours",
        "description": "Dangerous road crater with exposed aggregate causing vehicular axle shock."
    },
    "garbage": {
        "categoryName": "Solid Waste Dump",
        "severity": "Medium",
        "department": "Solid Waste Management (SWM)",
        "sla": "Under 24 hours",
        "description": "Municipal dumpster overflowing onto public footway."
    },
    "water_leak": {
        "categoryName": "Water Main Burst",
        "severity": "High",
        "department": "Water Supply & Sewerage Board",
        "sla": "Under 4 hours",
        "description": "Pressurized drinking water pipeline burst eroding surface tarmac."
    },
    "streetlight": {
        "categoryName": "Damaged Streetlight",
        "severity": "Low",
        "department": "Electricity Supply Company",
        "sla": "Under 48 hours",
        "description": "Overhead luminaire failure creating dark pedestrian vulnerability."
    },
    "drainage": {
        "categoryName": "Clogged Storm Drain",
        "severity": "High",
        "department": "Stormwater Drain Department",
        "sla": "Under 4 hours",
        "description": "Debris blockage preventing active monsoon surface drainage."
    }
}

def train():
    device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
    print(f"[*] Training on device: {device}")

    # Standard computer vision data augmentation & normalization
    data_transforms = {
        "train": transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.RandomHorizontalFlip(),
            transforms.RandomRotation(10),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ]),
        "val": transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ]),
    }

    train_dir = os.path.join(DATASET_DIR, "train")
    val_dir = os.path.join(DATASET_DIR, "val")

    train_dataset = datasets.ImageFolder(train_dir, data_transforms["train"])
    val_dataset = datasets.ImageFolder(val_dir, data_transforms["val"])

    class_names = train_dataset.classes
    print(f"[+] Detected classes ({len(class_names)}): {class_names}")

    train_loader = torch.utils.data.DataLoader(train_dataset, batch_size=4, shuffle=True)
    val_loader = torch.utils.data.DataLoader(val_dataset, batch_size=4, shuffle=False)

    # Use pretrained MobileNetV3 (lightweight, blazing-fast, mobile-optimized)
    print("[*] Initializing MobileNetV3 architecture...")
    model = models.mobilenet_v3_small(weights=models.MobileNet_V3_Small_Weights.DEFAULT)

    # Replace classifier head with our 5 classes
    num_ftrs = model.classifier[3].in_features
    model.classifier[3] = nn.Linear(num_ftrs, len(class_names))
    model = model.to(device)

    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001)

    epochs = 6
    print(f"[*] Starting training loop for {epochs} epochs...")

    for epoch in range(epochs):
        model.train()
        running_loss = 0.0
        correct = 0
        total = 0

        for inputs, labels in train_loader:
            inputs = inputs.to(device)
            labels = labels.to(device)

            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            running_loss += loss.item() * inputs.size(0)
            _, preds = torch.max(outputs, 1)
            correct += torch.sum(preds == labels.data).item()
            total += labels.size(0)

        epoch_loss = running_loss / total
        epoch_acc = correct / total
        print(f"  Epoch [{epoch+1}/{epochs}] - Loss: {epoch_loss:.4f} - Accuracy: {epoch_acc*100:.1f}%")

    # Evaluation on Validation set
    model.eval()
    val_correct = 0
    val_total = 0
    with torch.no_grad():
        for inputs, labels in val_loader:
            inputs = inputs.to(device)
            labels = labels.to(device)
            outputs = model(inputs)
            _, preds = torch.max(outputs, 1)
            val_correct += torch.sum(preds == labels.data).item()
            val_total += labels.size(0)

    val_acc = (val_correct / val_total) * 100 if val_total > 0 else 100.0
    print(f"\n[+] Validation Accuracy: {val_acc:.1f}%")

    # Save model weights & class mapping
    torch.save(model.state_dict(), MODEL_SAVE_PATH)
    with open(CLASSES_SAVE_PATH, "w", encoding="utf-8") as f:
        json.dump({
            "classes": class_names,
            "metadata": CLASS_METADATA
        }, f, indent=2)

    print(f"[SUCCESS] Model saved to: {MODEL_SAVE_PATH}")
    print(f"[SUCCESS] Class definitions saved to: {CLASSES_SAVE_PATH}")

if __name__ == "__main__":
    train()
