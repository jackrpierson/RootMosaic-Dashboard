import requests
import pandas as pd
from datetime import datetime, timedelta
from transformers import pipeline

class ReviewIngestion:
    def __init__(self, google_api_key=None, google_place_id=None,
                 yelp_api_key=None, yelp_business_id=None,
                 bing_api_key=None, csv_path=None):
        self.google_api_key = google_api_key
        self.google_place_id = google_place_id
        self.yelp_api_key = yelp_api_key
        self.yelp_business_id = yelp_business_id
        self.bing_api_key = bing_api_key
        self.csv_path = csv_path

        # ✅ Explicit model specification, pinned revision, forced to CPU
        self.sentiment_analyzer = pipeline(
            "sentiment-analysis",
            model="distilbert/distilbert-base-uncased-finetuned-sst-2-english",
            revision="714eb0f",  # pin revision for stability
            device=-1           # -1 means always use CPU
        )

    def fetch_google_reviews(self, max_reviews=100):
        if not self.google_api_key or not self.google_place_id:
            return pd.DataFrame()

        try:
            url = "https://maps.googleapis.com/maps/api/place/details/json"
            params = {
                "place_id": self.google_place_id,
                "fields": "review",
                "key": self.google_api_key
            }
            response = requests.get(url, params=params).json()
            reviews = response.get("result", {}).get("reviews", [])
            if not reviews:
                return pd.DataFrame()

            return pd.DataFrame([{
                "Author": r.get("author_name"),
                "Date": pd.to_datetime(r.get("time"), unit="s"),
                "Rating": r.get("rating"),
                "Review_Text": r.get("text")
            } for r in reviews[:max_reviews]])

        except Exception:
            return pd.DataFrame()

    def fetch_yelp_reviews(self, max_reviews=100):
        if not self.yelp_api_key or not self.yelp_business_id:
            return pd.DataFrame()

        try:
            url = f"https://api.yelp.com/v3/businesses/{self.yelp_business_id}/reviews"
            headers = {"Authorization": f"Bearer {self.yelp_api_key}"}
            response = requests.get(url, headers=headers).json()
            reviews = response.get("reviews", [])
            if not reviews:
                return pd.DataFrame()

            return pd.DataFrame([{
                "Author": r.get("user", {}).get("name"),
                "Date": pd.to_datetime(r.get("time_created")),
                "Rating": r.get("rating"),
                "Review_Text": r.get("text")
            } for r in reviews[:max_reviews]])

        except Exception:
            return pd.DataFrame()

    def fetch_bing_reviews(self, max_reviews=100):
        if not self.bing_api_key:
            return pd.DataFrame()

        try:
            url = "https://api.bing.microsoft.com/v7.0/localbusinesses/reviews"
            headers = {"Ocp-Apim-Subscription-Key": self.bing_api_key}
            response = requests.get(url, headers=headers).json()
            reviews = response.get("reviews", [])
            if not reviews:
                return pd.DataFrame()

            return pd.DataFrame([{
                "Author": r.get("author"),
                "Date": pd.to_datetime(r.get("datePublished")),
                "Rating": r.get("rating"),
                "Review_Text": r.get("reviewBody")
            } for r in reviews[:max_reviews]])

        except Exception:
            return pd.DataFrame()

    def fetch_reviews_from_csv(self):
        if not self.csv_path:
            return pd.DataFrame()

        try:
            return pd.read_csv(self.csv_path, parse_dates=["Date"])
        except Exception:
            return pd.DataFrame()

    def add_sentiment(self, df_reviews):
        if df_reviews.empty:
            return df_reviews

        df_reviews["Sentiment_Score"] = df_reviews["Review_Text"].apply(
            lambda x: self.sentiment_analyzer(x)[0]["score"] if pd.notna(x) and str(x).strip() else 0
        )
        return df_reviews

    def aggregate_reviews(self, df_reviews, lookback_days=180):
        if df_reviews.empty:
            return pd.DataFrame({
                "Avg_Rating": [0],
                "Avg_Sentiment": [0],
                "Review_Count": [0],
                "Recent_Keywords": [""]
            })

        cutoff = datetime.now() - timedelta(days=lookback_days)
        recent_reviews = df_reviews[df_reviews["Date"] >= cutoff]

        if recent_reviews.empty:
            return pd.DataFrame({
                "Avg_Rating": [0],
                "Avg_Sentiment": [0],
                "Review_Count": [0],
                "Recent_Keywords": [""]
            })

        # Keyword extraction
        all_words = " ".join(recent_reviews["Review_Text"].dropna().tolist()).lower().split()
        keywords = pd.Series(all_words).value_counts().head(10).index.tolist()

        return pd.DataFrame({
            "Avg_Rating": [recent_reviews["Rating"].mean()],
            "Avg_Sentiment": [recent_reviews["Sentiment_Score"].mean()],
            "Review_Count": [len(recent_reviews)],
            "Recent_Keywords": ["; ".join(keywords)]
        })

    def run_ingestion(self, lookback_days=180):
        reviews = self.fetch_google_reviews()
        if reviews.empty:
            reviews = self.fetch_yelp_reviews()
        if reviews.empty:
            reviews = self.fetch_bing_reviews()
        if reviews.empty:
            reviews = self.fetch_reviews_from_csv()

        if reviews.empty:
            return pd.DataFrame({
                "Avg_Rating": [0],
                "Avg_Sentiment": [0],
                "Review_Count": [0],
                "Recent_Keywords": [""]
            }), reviews

        reviews = self.add_sentiment(reviews)
        features = self.aggregate_reviews(reviews, lookback_days=lookback_days)
        return features, reviews
