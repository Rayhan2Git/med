import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "medicines.db")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    c = conn.cursor()

    c.execute("""
        CREATE TABLE IF NOT EXISTS generics (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            name_bn TEXT,
            therapeutic_class TEXT,
            slug TEXT,
            brand_count INTEGER DEFAULT 0
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS brands (
            id INTEGER PRIMARY KEY,
            generic_id INTEGER,
            name TEXT NOT NULL,
            name_bn TEXT,
            strength TEXT,
            dosage_form TEXT,
            manufacturer TEXT,
            unit_price REAL,
            strip_price REAL,
            box_price REAL,
            strip_size INTEGER,
            box_size INTEGER,
            slug TEXT,
            indications TEXT,
            pharmacology TEXT,
            dosage TEXT,
            side_effects TEXT,
            contraindications TEXT,
            FOREIGN KEY (generic_id) REFERENCES generics(id)
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS scrape_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source TEXT,
            page_type TEXT,
            page_number INTEGER,
            items_count INTEGER,
            scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    c.execute("CREATE INDEX IF NOT EXISTS idx_brands_generic ON brands(generic_id)")
    c.execute("CREATE INDEX IF NOT EXISTS idx_brands_name ON brands(name)")
    c.execute("CREATE INDEX IF NOT EXISTS idx_generics_name ON generics(name)")

    conn.commit()
    conn.close()
    print("Database initialized successfully.")


def rebuild_fts():
    conn = get_db()
    c = conn.cursor()

    c.execute("DROP TABLE IF EXISTS brands_fts")
    c.execute("DROP TABLE IF EXISTS generics_fts")

    c.execute("""
        CREATE VIRTUAL TABLE brands_fts USING fts5(
            name, name_bn, strength, manufacturer, generic_name
        )
    """)

    c.execute("""
        CREATE VIRTUAL TABLE generics_fts USING fts5(
            name, name_bn
        )
    """)

    c.execute("""
        INSERT INTO generics_fts(rowid, name, name_bn)
        SELECT id, name, name_bn FROM generics
    """)

    c.execute("""
        INSERT INTO brands_fts(rowid, name, name_bn, strength, manufacturer, generic_name)
        SELECT b.id, b.name, b.name_bn, b.strength, b.manufacturer, g.name
        FROM brands b
        LEFT JOIN generics g ON b.generic_id = g.id
    """)

    conn.commit()
    c.execute("SELECT COUNT(*) FROM brands_fts")
    brands_count = c.fetchone()[0]
    c.execute("SELECT COUNT(*) FROM generics_fts")
    generics_count = c.fetchone()[0]
    conn.close()
    print(f"FTS rebuilt: {brands_count} brands, {generics_count} generics")


if __name__ == "__main__":
    init_db()
