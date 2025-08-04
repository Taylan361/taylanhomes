import axios from "axios";
import  { Property } from "../types/Property";

const API_URL = "http://localhost:5000/api";

export const fetchProperties = async (): Promise<Property[]> => {
  const response = await axios.get(`${API_URL}/properties`);
  return response.data;
};

export const fetchPropertyById = async (id: string): Promise<Property> => {
  const response = await axios.get(`${API_URL}/properties/${id}`);
  return response.data;
};
