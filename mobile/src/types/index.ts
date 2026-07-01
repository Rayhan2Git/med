export interface Brand {
  id: number;
  name: string;
  name_bn?: string;
  strength?: string;
  dosage_form?: string;
  manufacturer?: string;
  unit_price?: number;
  strip_price?: number;
  box_price?: number;
  slug?: string;
  generic_name?: string;
  generic_id?: number;
}

export interface Generic {
  id: number;
  name: string;
  name_bn?: string;
  therapeutic_class?: string;
  brand_count?: number;
  actual_brand_count?: number;
}

export interface BrandDetail extends Brand {
  indications?: string;
  pharmacology?: string;
  dosage?: string;
  side_effects?: string;
  contraindications?: string;
  alternatives?: Brand[];
}

export interface SearchResult {
  query: string;
  results: Brand[];
  total: number;
}

export interface AlternativesResponse {
  generic: Generic;
  brands: Brand[];
}

export interface PrescriptionMedicine {
  raw_name: string;
  strength: string;
  frequency: string;
  suggested_generic: string;
  confidence: number;
  db_matches: Brand[];
  cheapest?: Brand;
}

export interface PrescriptionResult {
  ocr_text: string;
  medicines: PrescriptionMedicine[];
  total_found: number;
  total_estimated_price: number;
}

export interface PrescriptionHistory {
  id: string;
  date: string;
  thumbnailUri?: string;
  ocrText: string;
  medicines: PrescriptionMedicine[];
  totalPrice: number;
}
