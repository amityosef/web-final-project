import initApp from "./index";

const PORT = process.env.PORT || 3000;

initApp().then((app) => {
  app.listen(PORT, () => {
      console.log(`🚀 HTTP Server is running on http://localhost:${PORT}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
    });
}).catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
