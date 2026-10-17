import axios from "axios";
import { API_BASE_URL } from "@/config/config";

// The only place that imports axios. Call sites pass paths relative to the API root
// (e.g. axiosClient.get("events")) and keep supplying their own auth headers.
const axiosClient = axios.create({ baseURL: API_BASE_URL });

export default axiosClient;
