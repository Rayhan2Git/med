import sqlite3
import os
import re

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "medicines.db")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def search_brands(query, limit=20):
    conn = get_db()
    c = conn.cursor()

    c.execute("""
        SELECT b.id, b.name, b.name_bn, b.strength, b.dosage_form,
               b.manufacturer, b.unit_price, b.strip_price, b.box_price,
               b.slug, g.name as generic_name, g.id as generic_id
        FROM brands b
        LEFT JOIN generics g ON b.generic_id = g.id
        WHERE b.name LIKE ? OR b.name LIKE ? OR b.name LIKE ?
           OR g.name LIKE ? OR g.name LIKE ?
        ORDER BY b.unit_price ASC
        LIMIT ?
    """, (f"%{query}%", f"{query}%", f"%{query}%",
          f"%{query}%", f"%{query}%", limit))

    results = [dict(row) for row in c.fetchall()]
    conn.close()
    return results


def search_fts(query, limit=20):
    conn = get_db()
    c = conn.cursor()

    try:
        fts_query = " OR ".join(query.split())
        c.execute("""
            SELECT b.id, b.name, b.name_bn, b.strength, b.dosage_form,
                   b.manufacturer, b.unit_price, b.strip_price, b.box_price,
                   b.slug, g.name as generic_name, g.id as generic_id
            FROM brands_fts fts
            JOIN brands b ON fts.rowid = b.id
            LEFT JOIN generics g ON b.generic_id = g.id
            WHERE brands_fts MATCH ?
            ORDER BY rank
            LIMIT ?
        """, (fts_query, limit))
        results = [dict(row) for row in c.fetchall()]
    except Exception:
        results = search_brands(query, limit)

    conn.close()
    return results


def get_brand_detail(brand_id):
    conn = get_db()
    c = conn.cursor()

    c.execute("""
        SELECT b.*, g.name as generic_name, g.therapeutic_class
        FROM brands b
        LEFT JOIN generics g ON b.generic_id = g.id
        WHERE b.id = ?
    """, (brand_id,))

    row = c.fetchone()
    if not row:
        conn.close()
        return None

    brand = dict(row)

    c.execute("""
        SELECT b.id, b.name, b.strength, b.manufacturer, b.unit_price,
               b.strip_price, b.dosage_form, b.slug
        FROM brands b
        WHERE b.generic_id = ? AND b.id != ?
        ORDER BY b.unit_price ASC
    """, (brand["generic_id"], brand_id))

    brand["alternatives"] = [dict(r) for r in c.fetchall()]
    conn.close()
    return brand


def get_alternatives(generic_id, limit=100):
    conn = get_db()
    c = conn.cursor()

    c.execute("SELECT name FROM generics WHERE id = ?", (generic_id,))
    generic = c.fetchone()
    if not generic:
        conn.close()
        return None

    c.execute("""
        SELECT b.id, b.name, b.strength, b.manufacturer, b.unit_price,
               b.strip_price, b.dosage_form, b.slug
        FROM brands b
        WHERE b.generic_id = ?
        ORDER BY b.unit_price ASC
        LIMIT ?
    """, (generic_id, limit))

    brands = [dict(row) for row in c.fetchall()]
    conn.close()
    return {"generic": dict(generic), "brands": brands}


def get_generics(page=1, per_page=50):
    conn = get_db()
    c = conn.cursor()
    offset = (page - 1) * per_page

    c.execute("SELECT COUNT(*) as total FROM generics")
    total = c.fetchone()["total"]

    c.execute("""
        SELECT g.*, COUNT(b.id) as actual_brand_count
        FROM generics g
        LEFT JOIN brands b ON g.id = b.generic_id
        GROUP BY g.id
        ORDER BY g.name ASC
        LIMIT ? OFFSET ?
    """, (per_page, offset))

    generics = [dict(row) for row in c.fetchall()]
    conn.close()
    return {"generics": generics, "total": total, "page": page, "per_page": per_page}


def get_dosage_forms():
    conn = get_db()
    c = conn.cursor()
    c.execute("""
        SELECT dosage_form, COUNT(*) as count
        FROM brands
        WHERE dosage_form IS NOT NULL AND dosage_form != ''
        GROUP BY dosage_form
        ORDER BY count DESC
    """)
    forms = [dict(row) for row in c.fetchall()]
    conn.close()
    return forms


def get_stats():
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT COUNT(*) as total FROM generics")
    generics_count = c.fetchone()["total"]
    c.execute("SELECT COUNT(*) as total FROM brands")
    brands_count = c.fetchone()["total"]
    c.execute("SELECT COUNT(*) as total FROM brands WHERE unit_price IS NOT NULL")
    with_price = c.fetchone()["total"]
    conn.close()
    return {
        "generics": generics_count,
        "brands": brands_count,
        "brands_with_price": with_price
    }
