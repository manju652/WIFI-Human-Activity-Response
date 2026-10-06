"""
Model Training & Comparison
============================
Trains Random Forest, SVM, CNN and LSTM on the preprocessed real CSI
dataset, evaluates each with accuracy/precision/recall/F1/confusion
matrix, and saves the best-performing model + a results report.

No accuracy numbers are hardcoded anywhere - everything below is
computed from an actual train/test split on real data.
"""

import json
import time
from pathlib import Path

import numpy as np
import joblib
import torch
import torch.nn as nn
from torch.utils.data import TensorDataset, DataLoader
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    accuracy_score, precision_recall_fscore_support, confusion_matrix,
    classification_report,
)

from preprocessing import LABEL_NAMES, PROCESSED_DIR
from features import extract_features_batch

MODELS_DIR = Path(__file__).resolve().parent.parent / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)
RESULTS_PATH = MODELS_DIR / "evaluation_report.json"

RANDOM_STATE = 42
torch.manual_seed(RANDOM_STATE)
np.random.seed(RANDOM_STATE)


def load_data():
    X = np.load(PROCESSED_DIR / "X.npy")   # [N, T, 64]
    y = np.load(PROCESSED_DIR / "y.npy")   # [N]
    return X, y


def evaluate(y_true, y_pred, label_names):
    acc = accuracy_score(y_true, y_pred)
    prec, rec, f1, _ = precision_recall_fscore_support(
        y_true, y_pred, average="weighted", zero_division=0
    )
    cm = confusion_matrix(y_true, y_pred).tolist()
    report = classification_report(
        y_true, y_pred, target_names=[label_names[i] for i in sorted(set(y_true))],
        zero_division=0, output_dict=True,
    )
    return {
        "accuracy": float(acc),
        "precision_weighted": float(prec),
        "recall_weighted": float(rec),
        "f1_weighted": float(f1),
        "confusion_matrix": cm,
        "per_class_report": report,
    }


# ---------------------------------------------------------------- CNN
class CSI_CNN(nn.Module):
    def __init__(self, n_subcarriers, n_classes):
        super().__init__()
        self.net = nn.Sequential(
            nn.Conv1d(n_subcarriers, 32, kernel_size=5, padding=2),
            nn.BatchNorm1d(32), nn.ReLU(), nn.MaxPool1d(2),
            nn.Conv1d(32, 64, kernel_size=5, padding=2),
            nn.BatchNorm1d(64), nn.ReLU(), nn.AdaptiveAvgPool1d(1),
        )
        self.fc = nn.Sequential(nn.Flatten(), nn.Linear(64, 64), nn.ReLU(),
                                 nn.Dropout(0.3), nn.Linear(64, n_classes))

    def forward(self, x):  # x: [B, T, C] -> need [B, C, T]
        x = x.permute(0, 2, 1)
        return self.fc(self.net(x))


# ---------------------------------------------------------------- LSTM
class CSI_LSTM(nn.Module):
    def __init__(self, n_subcarriers, n_classes, hidden=64):
        super().__init__()
        self.lstm = nn.LSTM(n_subcarriers, hidden, batch_first=True, num_layers=1)
        self.fc = nn.Sequential(nn.Linear(hidden, 32), nn.ReLU(),
                                 nn.Dropout(0.3), nn.Linear(32, n_classes))

    def forward(self, x):  # x: [B, T, C]
        out, (h_n, _) = self.lstm(x)
        return self.fc(h_n[-1])


def train_torch_model(model, X_train, y_train, X_val, y_val, epochs=25, lr=1e-3, batch_size=16):
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model.to(device)
    opt = torch.optim.Adam(model.parameters(), lr=lr, weight_decay=1e-4)
    crit = nn.CrossEntropyLoss()

    train_ds = TensorDataset(torch.tensor(X_train, dtype=torch.float32),
                              torch.tensor(y_train, dtype=torch.long))
    train_dl = DataLoader(train_ds, batch_size=batch_size, shuffle=True)

    Xv = torch.tensor(X_val, dtype=torch.float32).to(device)
    yv = torch.tensor(y_val, dtype=torch.long).to(device)

    best_val_acc, best_state = 0.0, None
    for epoch in range(epochs):
        model.train()
        for xb, yb in train_dl:
            xb, yb = xb.to(device), yb.to(device)
            opt.zero_grad()
            loss = crit(model(xb), yb)
            loss.backward()
            opt.step()
        model.eval()
        with torch.no_grad():
            val_pred = model(Xv).argmax(dim=1)
            val_acc = (val_pred == yv).float().mean().item()
        if val_acc > best_val_acc:
            best_val_acc, best_state = val_acc, {k: v.clone() for k, v in model.state_dict().items()}
    if best_state is not None:
        model.load_state_dict(best_state)
    return model, best_val_acc


def predict_torch(model, X):
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model.eval()
    with torch.no_grad():
        logits = model(torch.tensor(X, dtype=torch.float32).to(device))
        probs = torch.softmax(logits, dim=1)
        preds = probs.argmax(dim=1).cpu().numpy()
        conf = probs.max(dim=1).values.cpu().numpy()
    return preds, conf


def main():
    print("[train] Loading preprocessed real CSI data...")
    X, y = load_data()
    n_classes = len(LABEL_NAMES)
    print(f"[train] X={X.shape} y={y.shape} classes={n_classes}")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=RANDOM_STATE, stratify=y
    )
    X_train, X_val, y_train, y_val = train_test_split(
        X_train, y_train, test_size=0.15, random_state=RANDOM_STATE, stratify=y_train
    )
    print(f"[train] split: train={len(X_train)} val={len(X_val)} test={len(X_test)}")

    results = {}

    # ---------------- Random Forest (on hand-crafted features) ----------------
    print("[train] Extracting features for classical models...")
    feat_train = extract_features_batch(X_train)
    feat_val = extract_features_batch(X_val)
    feat_test = extract_features_batch(X_test)
    scaler = StandardScaler().fit(np.vstack([feat_train, feat_val]))
    feat_train_s = scaler.transform(feat_train)
    feat_test_s = scaler.transform(feat_test)

    print("[train] Training Random Forest...")
    t0 = time.time()
    rf = RandomForestClassifier(n_estimators=200, max_depth=12, random_state=RANDOM_STATE,
                                 class_weight="balanced")
    rf.fit(np.vstack([feat_train_s, scaler.transform(feat_val)]), np.concatenate([y_train, y_val]))
    rf_pred = rf.predict(feat_test_s)
    results["random_forest"] = evaluate(y_test, rf_pred, LABEL_NAMES)
    results["random_forest"]["train_time_sec"] = round(time.time() - t0, 2)
    print(f"[train] RF test accuracy: {results['random_forest']['accuracy']:.4f}")

    # ---------------- SVM (on hand-crafted features) ----------------
    print("[train] Training SVM...")
    t0 = time.time()
    svm = SVC(kernel="rbf", C=10, gamma="scale", probability=True, class_weight="balanced",
              random_state=RANDOM_STATE)
    svm.fit(np.vstack([feat_train_s, scaler.transform(feat_val)]), np.concatenate([y_train, y_val]))
    svm_pred = svm.predict(feat_test_s)
    results["svm"] = evaluate(y_test, svm_pred, LABEL_NAMES)
    results["svm"]["train_time_sec"] = round(time.time() - t0, 2)
    print(f"[train] SVM test accuracy: {results['svm']['accuracy']:.4f}")

    # ---------------- CNN (on raw normalized windows) ----------------
    print("[train] Training CNN...")
    t0 = time.time()
    cnn = CSI_CNN(n_subcarriers=X.shape[2], n_classes=n_classes)
    cnn, val_acc = train_torch_model(cnn, X_train, y_train, X_val, y_val, epochs=30)
    cnn_pred, cnn_conf = predict_torch(cnn, X_test)
    results["cnn"] = evaluate(y_test, cnn_pred, LABEL_NAMES)
    results["cnn"]["train_time_sec"] = round(time.time() - t0, 2)
    results["cnn"]["best_val_accuracy"] = round(val_acc, 4)
    print(f"[train] CNN test accuracy: {results['cnn']['accuracy']:.4f}")

    # ---------------- LSTM (on raw normalized windows) ----------------
    print("[train] Training LSTM...")
    t0 = time.time()
    lstm = CSI_LSTM(n_subcarriers=X.shape[2], n_classes=n_classes)
    lstm, val_acc = train_torch_model(lstm, X_train, y_train, X_val, y_val, epochs=30)
    lstm_pred, lstm_conf = predict_torch(lstm, X_test)
    results["lstm"] = evaluate(y_test, lstm_pred, LABEL_NAMES)
    results["lstm"]["train_time_sec"] = round(time.time() - t0, 2)
    results["lstm"]["best_val_accuracy"] = round(val_acc, 4)
    print(f"[train] LSTM test accuracy: {results['lstm']['accuracy']:.4f}")

    # ---------------- Select best model by weighted F1 on held-out test set ----------------
    best_name = max(results, key=lambda k: results[k]["f1_weighted"])
    print(f"[train] BEST MODEL: {best_name} (f1_weighted={results[best_name]['f1_weighted']:.4f})")

    # ---------------- Save artifacts ----------------
    joblib.dump(rf, MODELS_DIR / "random_forest.joblib")
    joblib.dump(svm, MODELS_DIR / "svm.joblib")
    joblib.dump(scaler, MODELS_DIR / "feature_scaler.joblib")
    torch.save(cnn.state_dict(), MODELS_DIR / "cnn.pt")
    torch.save(lstm.state_dict(), MODELS_DIR / "lstm.pt")

    meta = {
        "best_model": best_name,
        "n_subcarriers": int(X.shape[2]),
        "window_size": int(X.shape[1]),
        "label_map": LABEL_NAMES,
        "trained_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
    }
    with open(MODELS_DIR / "model_meta.json", "w") as f:
        json.dump(meta, f, indent=2)

    with open(RESULTS_PATH, "w") as f:
        json.dump(results, f, indent=2)

    print(f"[train] Saved models + evaluation_report.json to {MODELS_DIR}")
    return results, best_name


if __name__ == "__main__":
    main()
