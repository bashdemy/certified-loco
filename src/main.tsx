import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./i18n/config";
import App from "./web/App";
import "./web/index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
