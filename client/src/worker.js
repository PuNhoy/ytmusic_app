
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Test the backend API
    if (url.pathname === "/api/health") {
      return Response.json({
        success: true,
        message: "YT Music backend is running!"
      });
    }

    // Handle unknown API routes
    if (url.pathname.startsWith("/api/")) {
      return Response.json(
        { success: false, message: "API route not found" },
        { status: 404 }
      );
    }

    // Serve the React + Vite frontend
    return env.ASSETS.fetch(request);
  }
};
