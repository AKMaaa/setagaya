import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";  // ✅ App.tsx が正しくインポートされているか確認
import reportWebVitals from "./reportWebVitals";  // ✅ reportWebVitals.ts も確認

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();
