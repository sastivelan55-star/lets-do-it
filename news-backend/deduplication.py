import re
import difflib
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse

TRACKING_PARAMS = {
    "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
    "ref", "fbclid", "gclid", "ved", "usg", "soc_src", "soc_trk", "feature"
}

def clean_canonical_url(raw_url: str) -> str:
    """Removes marketing, analytics, and tracking parameters to obtain a canonical URL."""
    if not raw_url:
        return ""
    try:
        parsed = urlparse(raw_url)
        query_dict = parse_qs(parsed.query, keep_blank_values=False)
        cleaned_query = {k: v for k, v in query_dict.items() if k.lower() not in TRACKING_PARAMS}
        new_query = urlencode(cleaned_query, doseq=True)
        # Normalize trailing slash
        path = parsed.path.rstrip("/")
        if not path:
            path = "/"
        cleaned_url = urlunparse((
            parsed.scheme.lower(),
            parsed.netloc.lower(),
            path,
            parsed.params,
            new_query,
            "" # strip anchor hash
        ))
        return cleaned_url
    except Exception:
        return raw_url.strip()

def normalize_title(title: str) -> str:
    """Normalizes headline text for similarity matching."""
    if not title:
        return ""
    # Lowercase
    t = title.lower()
    # Strip common publication suffixes (e.g., ' - The Hindu', ' | NDTV.com', ' - BBC News')
    t = re.sub(r"\s*[-|–—]\s*(the hindu|ndtv|times of india|bbc news|al jazeera|hindustan times|indian express|dw|france 24|dinamalar|google news).*$", "", t)
    # Remove non-alphanumeric chars (keep spaces and unicode characters for Tamil/regional)
    t = re.sub(r"[^\w\s]", " ", t)
    # Collapse multiple whitespaces
    t = re.sub(r"\s+", " ", t).strip()
    return t

def is_duplicate_title(candidate_title: str, existing_titles: list[str], threshold: float = 0.82) -> bool:
    """Checks if candidate title is substantially identical to an existing title."""
    norm_candidate = normalize_title(candidate_title)
    if not norm_candidate:
        return False

    for existing in existing_titles:
        norm_existing = normalize_title(existing)
        if not norm_existing:
            continue
        # Quick exact match
        if norm_candidate == norm_existing:
            return True
        # Similarity ratio
        ratio = difflib.SequenceMatcher(None, norm_candidate, norm_existing).ratio()
        if ratio >= threshold:
            return True

    return False

