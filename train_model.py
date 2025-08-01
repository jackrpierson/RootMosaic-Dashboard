import pandas as pd
import joblib
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import StratifiedKFold, cross_validate
from sklearn.metrics import classification_report

DATA_PATH = "data/transformed_service_data.csv"
MODEL_PATH = "models/model.pkl"

def train_model():
    print("🔧 Loading transformed data...")
    df = pd.read_csv(DATA_PATH)

    target_col = "Suspected_Misdiagnosis"
    if target_col not in df.columns:
        raise ValueError(f"Target column '{target_col}' not found in dataset")

    y = df[target_col]

    numeric_features = [
        "Efficiency_Deviation", "Efficiency_Loss", "Invoice total",
        "Labor hours billed", "Odometer reading", "Year",
        "Repeat_45d", "Complaint_Similarity", "Estimated_Loss", "Cluster_ID"
    ]
    categorical_features = [col for col in df.columns if col.startswith("ServicePerformed_")]
    X = df[numeric_features + categorical_features]

    # Show class distribution
    print("\n=== Class Distribution ===")
    print(y.value_counts())

    # Preprocessing
    numeric_transformer = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="mean")),
        ("scaler", StandardScaler())
    ])
    categorical_transformer = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("encoder", OneHotEncoder(handle_unknown="ignore"))
    ])
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", numeric_transformer, numeric_features),
            ("cat", categorical_transformer, categorical_features),
        ]
    )

    # Full model pipeline
    model = Pipeline(steps=[
        ("preprocessor", preprocessor),
        ("classifier", RandomForestClassifier(n_estimators=200, random_state=42))
    ])

    # Stratified K-Fold cross-validation
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    scoring = ["precision_macro", "recall_macro", "f1_macro", "accuracy"]

    print("\n🔧 Performing 5-Fold Cross-Validation...")
    cv_results = cross_validate(model, X, y, cv=skf, scoring=scoring, return_train_score=False)

    # Results
    print("\n✅ Cross-Validation Results")
    for metric in scoring:
        print(f"{metric.capitalize()}: {cv_results[f'test_{metric}'].mean():.3f} "
              f"± {cv_results[f'test_{metric}'].std():.3f}")

    # Train on full dataset
    print("\n🔧 Training final model on full dataset...")
    model.fit(X, y)

    # Evaluate on full dataset
    y_pred = model.predict(X)
    print("\n=== Classification Report (on full dataset) ===")
    print(classification_report(y, y_pred, zero_division=0))

    # Feature importances
    classifier = model.named_steps["classifier"]
    feature_names = model.named_steps["preprocessor"].get_feature_names_out()
    importances = pd.Series(classifier.feature_importances_, index=feature_names)
    print("\n=== Top 10 Most Important Features ===")
    print(importances.sort_values(ascending=False).head(10))

    # Save model
    joblib.dump(model, MODEL_PATH)
    print(f"\n✅ Final model saved to {MODEL_PATH}")

if __name__ == "__main__":
    train_model()
