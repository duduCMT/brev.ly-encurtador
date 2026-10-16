import axios from "axios";
import { BACKEND_URL } from "./constants";

export const api = axios.create({
  baseURL: BACKEND_URL,
});
