import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { installChromium } from "./utils/playwright.js";
import swaggerDocs from "./utils/swagger.js";
import indexRoutes from "./routes/index.js";
import getMp4Routes from "./routes/getMp4.js";

// Constants
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PORT = process.env.PORT || 3000;

// Install Chromium for Playwright
installChromium();

// Initialize Express
const app = express();

// Swagger Documentation
swaggerDocs(app);

// Configure Pug as the template engine
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

// Routes
app.use("/", indexRoutes);
app.use("/", getMp4Routes);

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API documentation available at http://localhost:${PORT}/api-docs`);
});
