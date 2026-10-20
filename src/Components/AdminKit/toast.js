/** Tiny toast store: `toast.success("Saved")`, rendered by <Toaster /> (see index.jsx). */
let nextId = 1;
const listeners = new Set();

const emit = (kind, message) => {
  const item = { id: nextId++, kind, message: String(message ?? "") };
  listeners.forEach((fn) => fn(item));
  return item.id;
};

export const toast = {
  success: (message) => emit("success", message),
  error: (message) => emit("error", message),
  info: (message) => emit("info", message),
};

export const subscribeToasts = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
