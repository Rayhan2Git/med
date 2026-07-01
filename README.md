# BD Medicine Price App

Bangladeshi medicine price lookup app with prescription scanning.

## Architecture

```
bd-medicine-app/
├── scraper/         # Python scraper (MedEx.com.bd)
├── api/             # FastAPI backend + OCR
├── mobile/          # React Native app (Expo)
└── data/            # SQLite database
```

## Quick Start

### 1. Scraper (populate database)

```bash
cd scraper
pip install -r requirements.txt
python database.py       # initialize DB
python medex_scraper.py  # scrape MedEx (~30 min for full run)
```

### 2. API Server

```bash
cd api
pip install -r requirements.txt
python server.py         # starts on http://localhost:8000
```

API endpoints:
- `GET /api/search?q=napa` - search medicines
- `GET /api/medicine/{id}` - medicine details + alternatives
- `GET /api/alternatives/{generic_id}` - all brands of same generic, sorted by price
- `GET /api/generics` - list generics (paginated)
- `GET /api/stats` - database stats
- `POST /api/ocr/upload-and-parse` - upload prescription image

### 3. Mobile App

```bash
cd mobile
npm install
npx expo start
```

Update `API_BASE` in `src/services/api.ts` to your server IP.

### 4. OCR (optional - for prescription scanning)

```bash
pip install paddleocr paddlepaddle
```

## Features

- Search 1600+ generic drugs, 15,000+ brands
- Price comparison across all brands of same generic
- Find cheapest alternative for any medicine
- Prescription photo scanning (PaddleOCR)
- Local history (no login required)

## Data Source

Scraped from [MedEx.com.bd](https://medex.com.bd) - Bangladesh's medicine index.
