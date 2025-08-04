export interface Property {
  id?: string;  // yeni eklenirken id olmayabilir, o yüzden optional yap
  nameKey: string;
  descriptionKey?: string;
  priceTRY?: number | string | null;
  priceUSD?: number | string | null;
  priceEUR?: number | string | null;
  imageUrl: string;
  galleryImages?: string[];
  location: string;
  bedrooms?: number | string | null;
  bathrooms?: number | string | null;
  area?: number | string | null;
  type: 'apartment' | 'land';
  status?: 'available' | 'sold';
  blockNumber?: string | null;
  parcelNumber?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isFeatured?: boolean;
}
