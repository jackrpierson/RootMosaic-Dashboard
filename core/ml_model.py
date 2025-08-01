import joblib
import pandas as pd

MODEL_PATH = "models/model.pkl"

# Human-readable labels
LABEL_MAP = {
    0: "Resolved",
    1: "Mechanical Misdiagnosis",
    2: "Technician Inefficiency"
}

def load_model():
    """Load the trained ML pipeline or model from disk."""
    try:
        model = joblib.load(MODEL_PATH)
        return model
    except Exception as e:
        raise RuntimeError(f"Error loading model: {e}")

def predict_misdiagnosis(df, model, show_features=False):
    """
    Predict misdiagnoses using either a Pipeline or a plain sklearn model.
    Ensures predictions map correctly to 0/1/2 labels.
    If show_features=True, returns the list of features actually used.
    """
    try:
        feature_names = None

        # Case 1: Pipeline with ColumnTransformer
        if hasattr(model, "named_steps") and "preprocessor" in model.named_steps:
            preprocessor = model.named_steps["preprocessor"]
            feature_names = []
            for name, transformer, cols in preprocessor.transformers:
                if transformer == "passthrough":
                    feature_names.extend(cols)
                else:
                    try:
                        feature_names.extend(transformer.get_feature_names_out(cols).tolist())
                    except Exception:
                        feature_names.extend(cols)

        # Case 2: Plain classifier with feature_names_in_
        elif hasattr(model, "feature_names_in_"):
            feature_names = model.feature_names_in_.tolist()

        # Case 3: fallback
        else:
            feature_names = df.select_dtypes(include=["number"]).columns.tolist()

    except Exception as e:
        raise RuntimeError(f"Could not extract feature names: {e}")

    # Align DataFrame with expected features
    X = df.copy()
    X = X[[col for col in X.columns if col in feature_names]].copy()
    for col in feature_names:
        if col not in X.columns:
            X[col] = 0
    X = X.fillna(0)

    try:
        preds = model.predict(X)
        class_map = {cls: LABEL_MAP.get(cls, f"Unknown ({cls})") for cls in model.classes_}
        df["Predicted_Misdiagnosis"] = preds
        df["Prediction_Label"] = [class_map.get(p, "Unknown") for p in preds]

        if show_features:
            return df, feature_names
        return df

    except Exception as e:
        raise RuntimeError(f"Prediction failed: {e}")
