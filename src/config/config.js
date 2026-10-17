// Single source of environment-dependent values. Nothing else may hardcode these.
// The fallback keeps deployments that don't set VITE_API_BASE_URL working unchanged.
const DEFAULT_API_BASE_URL =
  "https://dk5h700gx5.execute-api.ap-south-1.amazonaws.com/api/";

const withTrailingSlash = (url) => (url.endsWith("/") ? url : `${url}/`);

export const API_BASE_URL = withTrailingSlash(
  import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL
);

export const ROLES = {
  ADMIN: "ADMIN",
  DEPARTMENT: "DEPARTMENT",
  OWNER: "OWNER",
  APPROVER: "APPROVER",
  MARKETING: "MARKETING",
  ACCOUNTS: "ACCOUNTS",
  CA: "CA",
};
