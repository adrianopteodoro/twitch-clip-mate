import swaggerJsDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default function swaggerDocs(app) {
  const swaggerOptions = {
    swaggerDefinition: {
      openapi: "3.0.0",
      info: {
        title: "Twitch Clip Mate API",
        version: "1.0.0",
        description: "API documentation for Twitch Clip Mate",
      },
    },
    apis: [path.resolve(__dirname, "../routes/*.js")],
  };

  app.use((req, res, next) => {
    swaggerOptions.swaggerDefinition.servers = [
      {
        url: `${req.protocol}://${req.hostname}`,
      },
    ];
    next();
  });

  const swaggerDocs = swaggerJsDoc(swaggerOptions);
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
}