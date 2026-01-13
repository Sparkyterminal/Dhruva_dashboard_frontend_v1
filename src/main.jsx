import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import userReducer from "./reducers/users.js";
import { PersistGate } from "redux-persist/integration/react";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { BrowserRouter } from "react-router-dom";
import '@ant-design/v5-patch-for-react-19';

const reducers = combineReducers({
  user: userReducer,
});

const persistConfig = {
  key: "root",
  storage,
};

const persistedReducer = persistReducer(persistConfig, reducers);
const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }),
});

const persistor = persistStore(store);

createRoot(document.getElementById("root")).render(
  // <StrictMode>
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </PersistGate>
  </Provider>
  // </StrictMode>,
);
