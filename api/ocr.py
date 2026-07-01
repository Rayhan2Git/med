import os
import tempfile
from typing import Optional

ocr_instance = None


def get_ocr():
    global ocr_instance
    if ocr_instance is None:
        try:
            from paddleocr import PaddleOCR
            ocr_instance = PaddleOCR(
                use_angle_cls=True,
                lang="en",
                show_log=False,
                use_gpu=False
            )
            print("PaddleOCR initialized successfully")
        except ImportError:
            print("PaddleOCR not installed. Run: pip install paddleocr")
            return None
        except Exception as e:
            print(f"PaddleOCR init error: {e}")
            return None
    return ocr_instance


def extract_text_from_image(image_path: str) -> str:
    ocr = get_ocr()
    if ocr is None:
        return ""

    try:
        result = ocr.ocr(image_path, cls=True)
        if not result or not result[0]:
            return ""

        lines = []
        for line in result[0]:
            if line and len(line) >= 2:
                text = line[1][0]
                confidence = line[1][1]
                if confidence > 0.3:
                    lines.append(text)

        return "\n".join(lines)
    except Exception as e:
        print(f"OCR error: {e}")
        return ""


def extract_text_from_bytes(image_bytes: bytes) -> str:
    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
        tmp.write(image_bytes)
        tmp_path = tmp.name

    try:
        text = extract_text_from_image(tmp_path)
        return text
    finally:
        os.unlink(tmp_path)
