// Data-visibility cutoff, sourced only from the backend's real value
// (POST /user/login -> dataCutoffDate, see src/Dashboard/DATA_CUTOFF_GLOBAL_BACKEND.md).
// No hardcoded/mock fallback: if the backend hasn't returned a value yet
// (e.g. a session cached before this shipped), this returns null/undefined
// and callers simply don't send a date-floor param — never a fabricated date.
export const getEffectiveCutoffDate = (user) => user?.dataCutoffDate;
