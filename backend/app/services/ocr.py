import io
import os
import pytesseract
from PIL import Image
import pymupdf

# Tesseract binary path — installed at user-level on this machine
_TESSERACT_PATH = r"C:\Users\Packiavinslin.D\AppData\Local\Programs\Tesseract-OCR\tesseract.exe"
if os.path.exists(_TESSERACT_PATH):
    pytesseract.pytesseract.tesseract_cmd = _TESSERACT_PATH

_OCR_CONFIG = "--oem 3 --psm 6"  # LSTM engine, assume uniform block of text


def _ocr_image(img: Image.Image) -> str:
    return pytesseract.image_to_string(img, lang="eng", config=_OCR_CONFIG)


def extract_text(file_bytes: bytes, filename: str) -> str:
    """Extract text from any uploaded file using Tesseract.

    PDF pages are rendered to images first (300 DPI) then OCR'd.
    Image files (JPG, PNG, TIFF, BMP, WEBP) are OCR'd directly.
    Returns concatenated text from all pages, or empty string on failure.
    """
    ext = os.path.splitext(filename.lower())[1]

    try:
        if ext == ".pdf":
            return _extract_from_pdf(file_bytes)
        else:
            return _extract_from_image(file_bytes)
    except Exception:
        return ""


def _extract_from_pdf(file_bytes: bytes) -> str:
    doc = pymupdf.open(stream=file_bytes, filetype="pdf")
    pages_text: list[str] = []

    for page in doc:
        # Render at 300 DPI for good OCR quality
        mat = pymupdf.Matrix(300 / 72, 300 / 72)
        pix = page.get_pixmap(matrix=mat, colorspace=pymupdf.csRGB)
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        text = _ocr_image(img).strip()
        if text:
            pages_text.append(text)

    doc.close()
    return "\n\n--- Page Break ---\n\n".join(pages_text)


def _extract_from_image(file_bytes: bytes) -> str:
    img = Image.open(io.BytesIO(file_bytes))
    # Convert to RGB to avoid issues with RGBA/palette images
    if img.mode not in ("RGB", "L"):
        img = img.convert("RGB")
    return _ocr_image(img).strip()
