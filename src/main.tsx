import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

/**
 * Entry point for the React application.
 * Initializes the root element and renders the main App component.
 */
createRoot(document.getElementById("root")!).render(<App />);
