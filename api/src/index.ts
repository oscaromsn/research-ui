import { createApp } from "./app";

// Create the main app instance
export const app = createApp();

// Only start the server if this file is run directly (not imported for testing)
if (import.meta.main) {
  const port = process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 3001;

  app.listen(port, () => {
    console.log(`🦊 JurisConsulta API is running at http://localhost:${port}`);
    console.log(`📚 API Documentation: http://localhost:${port}/api/swagger`);
    console.log(`💓 Health Check: http://localhost:${port}/api/health`);
  });
}
