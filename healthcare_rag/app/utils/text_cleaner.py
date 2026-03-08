import re

def clean_text(text: str) -> str:
    # Remove multiple newlines
    text = re.sub(r"\n{2,}", "\n", text)

    # Remove extra spaces
    text = re.sub(r"[ \t]+", " ", text)

    # Remove website footer noise (customize if needed)
    text = re.sub(r"www\.[^\s]+", "", text)

    # Remove page numbers (simple pattern)
    text = re.sub(r"\n?\d+\n", "\n", text)

    return text.strip()