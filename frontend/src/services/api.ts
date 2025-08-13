import axios from "axios";
import type { Property } from "../types/Property";

// Ortam değişkeninden canlı URL'i çekin
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

// Tüm ilanları getirme (Admin Paneli için)
export const fetchAllProperties = async (): Promise<Property[]> => {
  const response = await axios.get(`${API_BASE_URL}/api/properties`);
  return response.data;
};

// Öne çıkan ilanları getirme (Ana sayfa için)
export const fetchFeaturedProperties = async (): Promise<Property[]> => {
  const response = await axios.get(`${API_BASE_URL}/api/properties?isFeatured=true`);
  return response.data;
};


// Tek bir ilanı ID'sine göre getirme
export const fetchPropertyById = async (id: string): Promise<Property> => {
  const response = await axios.get(`${API_BASE_URL}/api/properties/${id}`);
  return response.data;
};