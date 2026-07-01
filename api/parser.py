import re
from typing import List, Dict, Optional


KNOWN_ABBREVIATIONS = {
    "napa": "paracetamol",
    "nex": "omeprazole",
    "losec": "omeprazole",
    "amox": "amoxicillin",
    "amoxicap": "amoxicillin",
    "azithro": "azithromycin",
    "azee": "azithromycin",
    "metformin": "metformin",
    "glycomet": "metformin",
    "gliben": "glibenclamide",
    "amaryl": "glimepiride",
    "amlodac": "amlodipine",
    "cardace": "ramipril",
    "losartan": "losartan",
    "losar": "losartan",
    "atorva": "atorvastatin",
    "lipistar": "atorvastatin",
    "clopidogrel": "clopidogrel",
    "ecospirin": "aspirin",
    "aspirin": "aspirin",
    "almec": "salbutamol",
    "ventolin": "salbutamol",
    "sinarest": "paracetamol+phenylephrine+chlorpheniramine",
    "fexo": "fexofenadine",
    "zyrtec": "cetirizine",
    "alerid": "cetirizine",
    "pantop": "pantoprazole",
    "pantodac": "pantoprazole",
    "nexium": "esomeprazole",
    "ranitidine": "ranitidine",
    "zantac": "ranitidine",
    "flagyl": "metronidazole",
    "metrogyl": "metronidazole",
    "cipro": "ciprofloxacin",
    "ciprocin": "ciprofloxacin",
    "levoflox": "levofloxacin",
    "monas": "montelukast",
    "montair": "montelukast",
    "nasonex": "mometasone",
    "deriphyllin": "theophylline",
    "aceclofenac": "aceclofenac",
    "ace": "aceclofenac",
    "nise": "nimesulide",
    "nimesulide": "nimesulide",
    "diclo": "diclofenac",
    "voltaren": "diclofenac",
    "methylpred": "methylprednisolone",
    "prednisolone": "prednisolone",
    "dexamethasone": "dexamethasone",
    "dexa": "dexamethasone",
    "augmentin": "amoxicillin+clavulanate",
    "amoclav": "amoxicillin+clavulanate",
    "zinnat": "cefuroxime",
    "ceftriaxone": "ceftriaxone",
    "rocephin": "ceftriaxone",
    "cefixime": "cefixime",
    "taxim": "cefixime",
    "doxycycline": "doxycycline",
    "doxy": "doxycycline",
    "met XL": "metoprolol",
    "lozart": "losartan",
    "dilzem": "diltiazem",
    "corde": "bisoprolol",
    "nebicard": "nebivolol",
    "warfarin": "warfarin",
    "heparin": "heparin",
    "insulin": "insulin",
    "humulin": "insulin",
    "lantus": "insulin glargine",
    "novorapid": "insulin aspart",
}


def parse_prescription_text(ocr_text: str) -> List[Dict]:
    lines = [line.strip() for line in ocr_text.split("\n") if line.strip()]
    medicines = []

    rx_pattern = re.compile(
        r'(?:Rx|Tab|Cap|Syp|Susp|Inj|Drop|Cream|Oint|Gel|Lotion|Supp)[.:]*\s*(.*)',
        re.IGNORECASE
    )
    numbered_pattern = re.compile(r'^\d+[\.\)]\s*(.+)')
    name_dose_pattern = re.compile(
        r'([A-Za-z][A-Za-z\s\-\+\.]{1,30}?)\s+(\d+\.?\d*\s*(?:mg|ml|mcg|g|IU|%|mg/ml|mcg/ml)[\w\s]*)',
        re.IGNORECASE
    )
    frequency_pattern = re.compile(
        r'(\d+\s*(?:times?|t(?:/)?d|b\.?i\.?d|t\.?i\.?d|q\.?i\.?d|daily|once|twice|thrice)[\w\s]*|'
        r'(?:before|after)\s+(?:food|meal|bedtime)[\w\s]*|'
        r'\d+\s*(?:day|week|month)s?[\w\s]*|'
        r'(?:1|2|3)\s*(?:×|x)\s*(?:daily|per day))',
        re.IGNORECASE
    )

    for line in lines:
        clean = line
        for prefix in ["Rx:", "Rx.", "Rx", "Tab.", "Cap.", "Syp.", "Inj."]:
            if clean.lower().startswith(prefix.lower()):
                clean = clean[len(prefix):].strip()

        numbered = numbered_pattern.match(clean)
        if numbered:
            clean = numbered.group(1)

        name_match = name_dose_pattern.search(clean)
        if not name_match:
            for pattern in [rx_pattern, numbered_pattern]:
                m = pattern.search(line)
                if m:
                    clean = m.group(1).strip()
                    name_match = name_dose_pattern.search(clean)
                    if name_match:
                        break

        if name_match:
            raw_name = name_match.group(1).strip()
            strength = name_match.group(2).strip()

            frequency = ""
            freq_match = frequency_pattern.search(clean)
            if freq_match:
                frequency = freq_match.group(0).strip()

            generic = resolve_generic(raw_name)

            medicines.append({
                "raw_name": raw_name,
                "strength": strength,
                "frequency": frequency,
                "suggested_generic": generic,
                "confidence": 0.8 if generic else 0.4
            })
        else:
            possible_name = re.sub(r'[^\w\s\-]', '', clean).strip()
            if len(possible_name) > 2 and not re.match(r'^[\d\s]+$', possible_name):
                generic = resolve_generic(possible_name)
                if generic:
                    medicines.append({
                        "raw_name": possible_name,
                        "strength": "",
                        "frequency": "",
                        "suggested_generic": generic,
                        "confidence": 0.5
                    })

    return medicines


def resolve_generic(name: str) -> Optional[str]:
    lower = name.lower().strip()
    if lower in KNOWN_ABBREVIATIONS:
        return KNOWN_ABBREVIATIONS[lower]

    for abbrev, generic in KNOWN_ABBREVIATIONS.items():
        if lower.startswith(abbrev) or abbrev.startswith(lower):
            return generic

    words = lower.split()
    if words and words[0] in KNOWN_ABBREVIATIONS:
        return KNOWN_ABBREVIATIONS[words[0]]

    return None


def match_medicines_to_db(parsed_medicines: List[Dict], search_fn) -> List[Dict]:
    results = []
    for med in parsed_medicines:
        db_results = search_fn(med["raw_name"], limit=5)

        if not db_results and med["suggested_generic"]:
            db_results = search_fn(med["suggested_generic"], limit=5)

        med["db_matches"] = db_results
        med["cheapest"] = min(db_results, key=lambda x: x.get("unit_price") or 99999) if db_results else None
        results.append(med)

    return results
