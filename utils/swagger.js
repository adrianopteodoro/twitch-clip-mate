import swaggerJsDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

export default function swaggerDocs(app) {
  const swaggerOptions = {
    swaggerDefinition: {
      openapi: "3.0.0",
      info: {
        title: "Twitch Clip Player API",
        version: "1.0.0",
        description: "API documentation for Twitch Clip Player",
      },
    },
    apis: ["./routes/*.js"],
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