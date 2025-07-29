# backend/app/ai/services/crisis_detector.py
import re, json, logging
from typing import Dict, List
from datetime import datetime

import nltk
from nltk.sentiment import SentimentIntensityAnalyzer
from textblob import TextBlob

from app.crypto.identity import AnonymousIdentity


# ------------------------------------------------------------------ #
# Ensure required corpora are present                                #
# ------------------------------------------------------------------ #
for pack in ("vader_lexicon", "punkt"):
    try:
        nltk.data.find(pack)
    except LookupError:
        nltk.download(pack)

# ------------------------------------------------------------------ #
# Helper                                                            #
# ------------------------------------------------------------------ #
def _compile(patterns: List[str]) -> re.Pattern:
    """
    Compile word / phrase list into a single, case-insensitive regex that
    matches word boundaries OR flexible whitespace inside phrases.
    """
    escaped = []
    for p in patterns:
        p = re.escape(p)
        # allow 1-3 white-space characters between phrase tokens
        p = p.replace(r"\ ", r"\s{1,3}")
        escaped.append(p)
    joined = r"(?:\b" + r"\b|\b".join(escaped) + r"\b)"
    return re.compile(joined, re.I)


class CrisisDetector:
    # ------------------------------------------------------------------ #
    def __init__(self) -> None:
        # Sentiment engine
        self._vader = SentimentIntensityAnalyzer()
        # Phrase lists
        self._kw_high   = _compile(
            ["suicide", "kill myself", "end it all", "take my life",
             "better off dead", "no reason to live", "hurt myself",
             "self harm", "cut myself", "want to die"]
        )
        self._kw_medium = _compile(
            ["hopeless", "worthless", "give up", "can't go on",
             "no way out", "nobody cares", "dark thoughts",
             "pointless", "i'm a burden"]
        )
        self._kw_low    = _compile(
            ["sad", "depressed", "down", "anxious", "worried", "stressed",
             "overwhelmed", "tired of everything"]
        )
        # Crypto helper for encryption / decryption
        self._identity  = AnonymousIdentity()
        # Logging
        self._log       = logging.getLogger(__name__)

    # ================================================================== #
    # Public API                                                         #
    # ================================================================== #
    def analyze_encrypted_text(
        self, encrypted: str, commitment: str
    ) -> Dict:
        try:
            clear = self._identity.decrypt_sensitive_data(encrypted)
            result = self.analyze_text(clear)
            result.update({
                "user_commitment": commitment,
                "encrypted_original": True,
            })
            return result
        except Exception as exc:                       # pragma: no cover
            self._log.error("CrisisDetector decrypt/analyze failed: %s", exc)
            return self._default()

    def analyze_text(self, text: str) -> Dict:
        try:
            cleaned = self._clean(text)
            sentiments = self._vader.polarity_scores(cleaned)
            blob       = TextBlob(cleaned).sentiment
            match_info = self._keyword_scan(cleaned)

            risk = self._assess_risk(
                sentiments["compound"],
                blob.polarity,
                match_info["score"]
            )

            return {
                "risk_level": risk["level"],
                "risk_score": risk["score"],
                "needs_intervention": risk["needs_intervention"],
                "sentiment": {
                    "vader": sentiments,
                    "textblob": dict(polarity=blob.polarity,
                                     subjectivity=blob.subjectivity),
                },
                "keywords": match_info,
                "recommendations": self._recommend(risk["level"]),
                "analyzed_at": datetime.utcnow().isoformat(),
            }

        except Exception as exc:                       # pragma: no cover
            self._log.error("CrisisDetector analyze_text failed: %s", exc)
            return self._default()

    # ================================================================== #
    # Internal helpers                                                   #
    # ================================================================== #
    @staticmethod
    def _clean(txt: str) -> str:
        txt = re.sub(r"\s+", " ", txt.lower()).strip()
        return txt

    # ------------------------------------------------------------------ #
    def _keyword_scan(self, txt: str) -> Dict:
        """
        Return dict with:
          matches.{high|medium|low} : list[str]
          total_matches             : int
          score                     : float (0-1)
        """
        hits = {
            "high":   self._kw_high.findall(txt),
            "medium": self._kw_medium.findall(txt),
            "low":    self._kw_low.findall(txt),
        }

        # Weighting: high 1.0, medium 0.6, low 0.3   (sentence co-occurrence bonus below)
        base = (
            len(hits["high"])   * 1.0 +
            len(hits["medium"]) * 0.6 +
            len(hits["low"])    * 0.3
        )

        # Bonus: if two or more keywords occur in the same sentence, +0.5
        bonus = 0.0
        for sentence in re.split(r"[.!?]", txt):
            sentence = sentence.strip()
            if not sentence:
                continue
            count = (
                len(self._kw_high.findall(sentence)) +
                len(self._kw_medium.findall(sentence)) +
                len(self._kw_low.findall(sentence))
            )
            if count >= 2:
                bonus += 0.5

        score = min(base + bonus, 1.0)

        return {
            "matches": hits,
            "total_matches": sum(len(v) for v in hits.values()),
            "score": round(score, 3),
        }

    # ------------------------------------------------------------------ #
    def _assess_risk(
        self, vader_compound: float, blob_polarity: float, kw_score: float
    ) -> Dict:
        """
        Combine three signals into a 0-1 score, then map to level.
        -   Vader compound ≤ -0.5  ⇒  add up to 0.4
        -   Blob polarity  ≤ -0.4  ⇒  add up to 0.2
        -   Keyword score         ⇒  direct add (max 1.0 already capped)
        """
        v_part = max(0.0, -vader_compound) * 0.4  # range 0-0.4
        b_part = max(0.0, -blob_polarity) * 0.2   # range 0-0.2

        total  = min(kw_score + v_part + b_part, 1.0)

        if total >= 0.75:
            lvl, need = "HIGH", True
        elif total >= 0.45:
            lvl, need = "MEDIUM", True
        elif total >= 0.25:
            lvl, need = "LOW", False
        else:
            lvl, need = "MINIMAL", False

        return {"level": lvl, "score": round(total, 3),
                "needs_intervention": need}

    # ------------------------------------------------------------------ #
    @staticmethod
    def _recommend(level: str) -> List[str]:
        R = {
            "HIGH": [
                "Immediate professional intervention recommended",
                "Contact crisis helpline (AASRA 022-27546669 / iCall 9152987821)",
                "Reach out to a trusted person right now"
            ],
            "MEDIUM": [
                "Consider scheduling time with a counsellor",
                "Connect with supportive peers",
                "Use grounding or mindfulness techniques"
            ],
            "LOW": [
                "Maintain self-care habits",
                "Track your mood regularly",
                "Stay connected with friends or support groups"
            ],
            "MINIMAL": [
                "Keep up your positive routines",
                "Continue monitoring your wellbeing"
            ],
        }
        return R.get(level, R["MINIMAL"])

    # ------------------------------------------------------------------ #
    def _default(self) -> Dict:
        return {
            "risk_level": "UNKNOWN",
            "risk_score": 0.0,
            "needs_intervention": False,
            "sentiment": {},
            "keywords": {},
            "recommendations": ["Analysis failed, please try again."],
            "analyzed_at": datetime.utcnow().isoformat(),
        }
