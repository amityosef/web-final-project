import https from "https";
import http from "http";
import fs from "fs";
import path from "path";
import initApp from "./index";

const PORT = process.env.PORT || 3000;
const USE_HTTPS = process.env.USE_HTTPS === "true";

initApp().then((app) => {
  if (USE_HTTPS) {
    // HTTPS server
    const certPath = process.env.SSL_CERT_PATH || path.join(__dirname, "../certs/cert.pem");
    const keyPath = process.env.SSL_KEY_PATH || path.join(__dirname, "../certs/key.pem");

    if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
      console.error("SSL certificates not found. Please generate them using:");
      console.error("npm run generate-certs");
      console.error("Or set USE_HTTPS=false in your .env file");
      process.exit(1);
    }

    const httpsOptions = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    };

    https.createServer(httpsOptions, app).listen(PORT, () => {
      console.log(`🔒 HTTPS Server is running on https://localhost:${PORT}`);
      console.log(`📚 API Documentation: https://localhost:${PORT}/api-docs`);
    });

    // Optional: Redirect HTTP to HTTPS
    const HTTP_PORT = process.env.HTTP_PORT || 3080;
    http.createServer((req, res) => {
      res.writeHead(301, {
        Location: `https://${req.headers.host?.replace(`:${HTTP_PORT}`, `:${PORT}`)}${req.url}`
      });
      res.end();
    }).listen(HTTP_PORT, () => {
      console.log(`↪️  HTTP redirect server on http://localhost:${HTTP_PORT}`);
    });
  } else {
    // HTTP server
    app.listen(PORT, () => {
      console.log(`🚀 HTTP Server is running on http://localhost:${PORT}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
    });
  }
}).catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
