import https from "https";
import http from "http";
import fs from "fs";
import initApp from "./index";
import path from "path";

initApp().then((app) => {
  if (process.env.NODE_ENV != "production") {
    console.log("development")
    http.createServer(app).listen(process.env.PORT, () => {
      console.log(`🔒 HTTPS Server is running on https://localhost:${process.env.PORT}`);
      console.log(`📚 API Documentation: https://localhost:${process.env.PORT}/api-docs`);
    })
  } else {
    const httpsOptions = {
      key: fs.readFileSync(path.join(__dirname, "../../../client-key.pem")),
      cert: fs.readFileSync(path.join(__dirname, "../../../client-cert.pem")),
    };

    https.createServer(httpsOptions, app).listen(process.env.HTTPS_PORT, () => {
      console.log(`🔒 HTTPS Server is running on https://localhost:${process.env.HTTPS_PORT}`);
      console.log(`📚 API Documentation: https://localhost:${process.env.HTTPS_PORT}/api-docs`);
    });
  }
}).catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
