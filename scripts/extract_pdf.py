import sys
sys.stdout.reconfigure(encoding="utf-8")
import json
import re
from PyPDF2 import PdfReader

def detect_structure(page_text):
    """
    Detect title and bullets from PDF page text using heuristics.
    - Title: First non-empty line
    - Bullets: Lines starting with bullet chars, numbers, or indentation
    """
    if not page_text or not page_text.strip():
        return "", []

    lines = [line for line in page_text.split('\n') if line.strip()]

    if not lines:
        return "", []

    # First line is the title
    title = lines[0].strip()
    bullets = []

    # Process remaining lines
    for line in lines[1:]:
        stripped = line.strip()
        if not stripped:
            continue

        # Check if line is a bullet point
        # Patterns: •, -, *, ○, ▪, numbered (1., 2.), or indented
        is_bullet = (
            stripped.startswith(('•', '-', '*', '○', '▪', '●', '◦', '■', '□')) or
            re.match(r'^\d+[\.\)]\s', stripped) or  # 1. or 1)
            re.match(r'^[a-z][\.\)]\s', stripped, re.IGNORECASE) or  # a. or a)
            line.startswith(('  ', '\t'))  # Indented
        )

        if is_bullet:
            # Clean bullet character from the beginning
            cleaned = re.sub(r'^[•\-*○▪●◦■□]\s*', '', stripped)
            cleaned = re.sub(r'^\d+[\.\)]\s*', '', cleaned)
            cleaned = re.sub(r'^[a-z][\.\)]\s*', '', cleaned, flags=re.IGNORECASE)
            bullets.append(cleaned.strip())
        else:
            # Non-bullet line - append to previous bullet or create new one
            if bullets:
                # Append to the last bullet (continuation of previous point)
                bullets[-1] += ' ' + stripped
            else:
                # No bullets yet, treat as a bullet
                bullets.append(stripped)

    return title, bullets

def extract(path: str):
    """Extract text from PDF with structure detection."""
    try:
        reader = PdfReader(path)
    except Exception as e:
        return {"error": f"Failed to read PDF: {str(e)}"}

    # Check if PDF is encrypted
    if reader.is_encrypted:
        return {"error": "Cannot process encrypted PDF. Please provide an unencrypted file."}

    slides = []

    for i, page in enumerate(reader.pages, start=1):
        try:
            page_text = page.extract_text()
        except Exception as e:
            # If extraction fails for a page, skip it
            continue

        if not page_text or not page_text.strip():
            # Empty page - add with empty content
            slides.append({
                "index": i,
                "title": "",
                "bullets": [],
                "notes": ""
            })
            continue

        title, bullets = detect_structure(page_text)

        slides.append({
            "index": i,
            "title": title,
            "bullets": bullets,
            "notes": ""  # PDFs don't have speaker notes
        })

    if not slides:
        return {"error": "No text could be extracted from the PDF. It may be image-only."}

    return {"slides": slides}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "missing pdf path"}))
        sys.exit(1)

    path = sys.argv[1]
    result = extract(path)
    print(json.dumps(result, ensure_ascii=False))
