import https from "https";
import http from "http";
import fs from "fs";
import path from "path";
import initApp from "./index";

initApp()
    .then((app) => {
        if (process.env.NODE_ENV !== "production") {
            http.createServer(app).listen(process.env.PORT, () => {
                console.log(`Server running on http://localhost:${process.env.PORT}`);
            });
        } else {
            const httpsOptions = {
                key: fs.readFileSync(path.join(__dirname, "../../../client-key.pem")),
                cert: fs.readFileSync(path.join(__dirname, "../../../client-cert.pem")),
            };

            https.createServer(httpsOptions, app).listen(process.env.HTTPS_PORT, () => {
                console.log(`HTTPS Server running on https://localhost:${process.env.HTTPS_PORT}`);
            });
        }
    })
    .catch((error) => {
        console.error("Failed to start server:", error);
        process.exit(1);
    });
