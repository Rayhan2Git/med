from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import os

from search import search_brands, search_fts, get_brand_detail, get_alternatives, get_generics, get_dosage_forms, get_stats
from ocr import extract_text_from_bytes
from parser import parse_prescription_text, match_medicines_to_db

app = FastAPI(title="BD Medicine Price API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SearchResponse(BaseModel):
    query: str
    results: list
    total: int


class PrescriptionParseRequest(BaseModel):
    ocr_text: str


class PrescriptionItem(BaseModel):
    raw_name: str
    strength: str
    frequency: str
    suggested_generic: str
    confidence: float
    db_matches: list
    cheapest: Optional[dict]


@app.get("/")
def root():
    return {"message": "BD Medicine Price API", "version": "1.0.0"}


@app.get("/api/stats")
def stats():
    return get_stats()


@app.get("/api/search")
def search(q: str = Query(..., min_length=1), limit: int = Query(20, ge=1, le=100)):
    results = search_fts(q, limit=limit)
    if not results:
        results = search_brands(q, limit=limit)
    return SearchResponse(query=q, results=results, total=len(results))


@app.get("/api/medicine/{brand_id}")
def medicine_detail(brand_id: int):
    brand = get_brand_detail(brand_id)
    if not brand:
        raise HTTPException(status_code=404, detail="Medicine not found")
    return brand


@app.get("/api/alternatives/{generic_id}")
def alternatives(generic_id: int, limit: int = Query(100, ge=1, le=500)):
    result = get_alternatives(generic_id, limit=limit)
    if not result:
        raise HTTPException(status_code=404, detail="Generic not found")
    return result


@app.get("/api/generics")
def generics(page: int = Query(1, ge=1), per_page: int = Query(50, ge=1, le=200)):
    return get_generics(page=page, per_page=per_page)


@app.get("/api/dosage-forms")
def dosage_forms():
    return get_dosage_forms()


@app.post("/api/ocr/prescription")
async def ocr_prescription(file: UploadFile = File(...)):
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/jpg"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, WebP images are supported")

    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Max 10MB.")

    text = extract_text_from_bytes(contents)
    if not text:
        raise HTTPException(status_code=422, detail="Could not extract text from image")

    return {"ocr_text": text}


@app.post("/api/ocr/parse")
def parse_prescription(req: PrescriptionParseRequest):
    parsed = parse_prescription_text(req.ocr_text)
    results = match_medicines_to_db(parsed, search_brands)

    total_estimated = 0
    for med in results:
        if med["cheapest"] and med["cheapest"].get("unit_price"):
            total_estimated += med["cheapest"]["unit_price"]

    return {
        "medicines": results,
        "total_found": len(results),
        "total_estimated_price": round(total_estimated, 2)
    }


@app.post("/api/ocr/upload-and-parse")
async def upload_and_parse(file: UploadFile = File(...)):
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/jpg"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, WebP images are supported")

    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Max 10MB.")

    text = extract_text_from_bytes(contents)
    if not text:
        raise HTTPException(status_code=422, detail="Could not extract text from image")

    parsed = parse_prescription_text(text)
    results = match_medicines_to_db(parsed, search_brands)

    total_estimated = 0
    for med in results:
        if med["cheapest"] and med["cheapest"].get("unit_price"):
            total_estimated += med["cheapest"]["unit_price"]

    return {
        "ocr_text": text,
        "medicines": results,
        "total_found": len(results),
        "total_estimated_price": round(total_estimated, 2)
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
