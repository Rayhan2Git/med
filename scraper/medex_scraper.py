import requests
from bs4 import BeautifulSoup
import sqlite3
import time
import re
import os
import hashlib
from database import get_db, init_db, DB_PATH, rebuild_fts

BASE_URL = "https://medex.com.bd"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}
DELAY = 0.3


def fetch_page(url, retries=3):
    for attempt in range(retries):
        try:
            resp = requests.get(url, headers=HEADERS, timeout=15)
            resp.raise_for_status()
            return resp.text
        except requests.RequestException as e:
            print(f"  Retry {attempt+1}/{retries} for {url}: {e}")
            time.sleep(2)
    return None


def parse_price(text):
    if not text:
        return None
    match = re.search(r'[\d,]+\.?\d*', text.replace(",", ""))
    return float(match.group()) if match else None


def generate_brand_id(name, strength, company):
    key = f"{name}|{strength}|{company}".lower().strip()
    return int(hashlib.md5(key.encode()).hexdigest()[:8], 16)


def scrape_generics(alpha=None, page=1):
    url = f"{BASE_URL}/generics?page={page}"
    if alpha:
        url += f"&alpha={alpha}"
    print(f"Fetching generics page {page}...")
    html = fetch_page(url)
    if not html:
        return [], 0

    soup = BeautifulSoup(html, "html.parser")
    generics = []

    for link in soup.select("a[href*='/generics/']"):
        href = link.get("href", "")
        match = re.search(r'/generics/(\d+)/([\w-]+)', href)
        if not match:
            continue
        gid = int(match.group(1))
        slug = match.group(2)

        text = link.get_text(separator=" ", strip=True)
        name = text.split("\n")[0].strip()
        name = re.sub(r'\d+\s+available\s+brands?', '', name, flags=re.IGNORECASE).strip()
        if not name:
            name = slug.replace("-", " ").title()

        brand_count_match = re.search(r'(\d+)\s+available\s+brands', text, re.IGNORECASE)
        brand_count = int(brand_count_match.group(1)) if brand_count_match else 0

        if name and gid not in [g["id"] for g in generics]:
            generics.append({
                "id": gid,
                "name": name,
                "slug": slug,
                "brand_count": brand_count
            })

    total_pages = 1
    pagination = soup.select("ul.pagination a")
    for p in pagination:
        text = p.get_text(strip=True)
        if text.isdigit():
            total_pages = max(total_pages, int(text))

    return generics, total_pages


def scrape_generic_brands(generic_id, slug):
    url = f"{BASE_URL}/generics/{generic_id}/{slug}/brand-names"
    html = fetch_page(url)
    if not html:
        return []

    soup = BeautifulSoup(html, "html.parser")
    brands = []

    table = soup.find("table")
    if not table:
        return []

    rows = table.find_all("tr")
    for row in rows[1:]:
        cells = row.find_all("td")
        if len(cells) < 5:
            continue

        name = cells[0].get_text(strip=True)
        if not name:
            continue

        dosage_form = ""
        dosage_cell = cells[1]
        img = dosage_cell.find("img")
        if img and img.get("title"):
            dosage_form = img["title"]
        else:
            dosage_form = dosage_cell.get_text(strip=True)

        strength = cells[2].get_text(strip=True)
        manufacturer = cells[3].get_text(strip=True)

        price_cell = cells[4]
        price_text = price_cell.get_text(strip=True)
        price_match = re.search(r'\u09f3\s*([\d,.]+)', price_text)
        unit_price = None
        if price_match:
            try:
                unit_price = float(price_match.group(1).replace(",", ""))
            except ValueError:
                unit_price = None

        strip_match = re.search(r'\((\d+)\s*x\s*(\d+)', price_text)
        strip_size = int(strip_match.group(1)) if strip_match else None
        box_size = int(strip_match.group(2)) if strip_match else None

        box_price_match = re.search(r'(\d+)\s*x\s*\d+:\s*\u09f3\s*([\d,.]+)', price_text)
        box_price = float(box_price_match.group(2).replace(",", "")) if box_price_match else None

        brand_id = generate_brand_id(name, strength, manufacturer)

        brands.append({
            "id": brand_id,
            "name": name,
            "slug": "",
            "dosage_form": dosage_form,
            "strength": strength,
            "manufacturer": manufacturer,
            "unit_price": unit_price,
            "strip_size": strip_size,
            "box_size": box_size,
            "box_price": box_price
        })

    return brands


def scrape_brand_detail(brand_id, slug):
    url = f"{BASE_URL}/brands/{brand_id}/{slug}"
    html = fetch_page(url)
    if not html:
        return {}

    soup = BeautifulSoup(html, "html.parser")
    info = {}

    price_text = soup.get_text()
    unit_match = re.search(r'Unit Price:\s*\u09f3\s*([\d,.]+)', price_text)
    if unit_match:
        info["unit_price"] = float(unit_match.group(1).replace(",", ""))

    strip_match = re.search(r'Strip Price:\s*\u09f3\s*([\d,.]+)', price_text)
    if strip_match:
        info["strip_price"] = float(strip_match.group(1).replace(",", ""))

    box_match = re.search(r'Box Price:\s*\u09f3\s*([\d,.]+)', price_text)
    if box_match:
        info["box_price"] = float(box_match.group(1).replace(",", ""))

    strip_size_match = re.search(r'(\d+)\s*x\s*(\d+)', price_text)
    if strip_size_match:
        info["strip_size"] = int(strip_size_match.group(1))
        info["box_size"] = int(strip_size_match.group(2))

    strength_match = re.search(r'(\d+\.?\d*\s*(?:mg|ml|mcg|g|IU)[\w\s/\+]*)', price_text, re.IGNORECASE)
    if strength_match:
        info["strength"] = strength_match.group(1).strip()

    for section_name in ["indications", "pharmacology", "dosage", "side_effects", "contraindications"]:
        heading = soup.find(["h3", "h4", "strong"], string=re.compile(section_name, re.IGNORECASE))
        if heading:
            content = []
            for sib in heading.find_next_siblings():
                if sib.name in ["h3", "h4", "strong"]:
                    break
                text = sib.get_text(strip=True)
                if text:
                    content.append(text)
            info[section_name] = "\n".join(content)

    manufacturer_tag = soup.select_one("a[href*='/companies/']")
    if manufacturer_tag:
        info["manufacturer"] = manufacturer_tag.get_text(strip=True)

    return info


def save_generics(generics):
    conn = get_db()
    c = conn.cursor()
    for g in generics:
        c.execute("""
            INSERT OR REPLACE INTO generics (id, name, slug, brand_count)
            VALUES (?, ?, ?, ?)
        """, (g["id"], g["name"], g["slug"], g["brand_count"]))
    conn.commit()
    conn.close()


def save_brands(generic_id, brands):
    conn = get_db()
    c = conn.cursor()
    for b in brands:
        c.execute("""
            INSERT OR REPLACE INTO brands (id, generic_id, name, dosage_form, strength, manufacturer, unit_price, slug, strip_size, box_size, box_price)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (b["id"], generic_id, b["name"], b.get("dosage_form", ""), b["strength"], b["manufacturer"], b["unit_price"], b["slug"], b.get("strip_size"), b.get("box_size"), b.get("box_price")))
    conn.commit()
    conn.close()


def save_brand_detail(brand_id, detail):
    if not detail:
        return
    conn = get_db()
    c = conn.cursor()
    updates = []
    values = []
    for key in ["unit_price", "strip_price", "box_price", "strip_size", "box_size",
                 "strength", "manufacturer", "indications", "pharmacology", "dosage",
                 "side_effects", "contraindications"]:
        if key in detail and detail[key]:
            updates.append(f"{key} = ?")
            values.append(detail[key])
    if updates:
        values.append(brand_id)
        c.execute(f"UPDATE brands SET {', '.join(updates)} WHERE id = ?", values)
        conn.commit()
    conn.close()


def log_scrape(source, page_type, page_number, items_count):
    conn = get_db()
    c = conn.cursor()
    c.execute("""
        INSERT INTO scrape_log (source, page_type, page_number, items_count)
        VALUES (?, ?, ?, ?)
    """, (source, page_type, page_number, items_count))
    conn.commit()
    conn.close()


def run_full_scrape(skip_details=False):
    init_db()

    print("=== Phase 1: Scraping Generics ===")
    all_generics = []
    for page in range(1, 100):
        generics, total_pages = scrape_generics(page=page)
        if not generics:
            break
        all_generics.extend(generics)
        save_generics(generics)
        log_scrape("medex", "generics", page, len(generics))
        print(f"  Page {page}: found {len(generics)} generics (total so far: {len(all_generics)})")
        if page >= total_pages:
            break
        time.sleep(DELAY)

    print(f"\nTotal generics found: {len(all_generics)}")

    print("\n=== Phase 2: Scraping Brand Names per Generic ===")
    total_brands = 0
    for i, generic in enumerate(all_generics):
        brands = scrape_generic_brands(generic["id"], generic["slug"])
        if brands:
            save_brands(generic["id"], brands)
            total_brands += len(brands)
            log_scrape("medex", "brands", generic["id"], len(brands))
        if (i + 1) % 50 == 0:
            print(f"  Progress: {i+1}/{len(all_generics)} generics, {total_brands} brands total")
        time.sleep(DELAY)

    print(f"\nTotal brands found: {total_brands}")

    print("\n=== Scrape Complete ===")
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT COUNT(*) FROM generics")
    print(f"Generics in DB: {c.fetchone()[0]}")
    c.execute("SELECT COUNT(*) FROM brands")
    print(f"Brands in DB: {c.fetchone()[0]}")
    c.execute("SELECT COUNT(*) FROM brands WHERE unit_price IS NOT NULL")
    print(f"Brands with price: {c.fetchone()[0]}")
    conn.close()

    print("\n=== Rebuilding Search Index ===")
    rebuild_fts()
    print("Done!")


if __name__ == "__main__":
    import sys
    run_full_scrape()
