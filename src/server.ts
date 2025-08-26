import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { analyzeWebsite } from "./services/analyzer";

const app = express();
const PORT = process.env["PORT"] || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan("combined"));
app.use(express.json());

// API Routes
app.get("/", (_req: Request, res: Response) => {
   res.json({
      name: "Design Inspector API",
      version: "1.0.0",
      description:
         "A Visual Design Intelligence Platform API for analyzing website design systems",
      endpoints: {
         "POST /api/analyze": "Analyze a website's design system",
         "GET /api/health": "Health check endpoint",
      },
   });
});

// API endpoint for website analysis
app.post("/api/analyze", async (req: Request, res: Response) => {
   try {
      const { url } = req.body;

      if (!url) {
         return res.status(400).json({
            success: false,
            error: "URL is required",
         });
      }

      console.log(`Analyzing website: ${url}`);
      const analysis = await analyzeWebsite(url);

      return res.json({
         success: true,
         url: url,
         timestamp: new Date().toISOString(),
         data: analysis,
      });
   } catch (error) {
      console.error("Analysis error:", error);
      return res.status(500).json({
         success: false,
         error:
            error instanceof Error
               ? error.message
               : "Failed to analyze website",
      });
   }
});

// Health check endpoint
app.get("/api/health", (_req: Request, res: Response) => {
   res.json({
      status: "OK",
      timestamp: new Date().toISOString(),
      service: "Design Inspector API",
   });
});

// 404 handler for undefined routes
app.use("*", (_req: Request, res: Response) => {
   res.status(404).json({
      success: false,
      error: "Endpoint not found",
      availableEndpoints: ["GET /", "POST /api/analyze", "GET /api/health"],
   });
});

app.listen(PORT, () => {
   console.log(`🚀 Design Inspector API server running on port ${PORT}`);
   console.log(`📊 API available at http://localhost:${PORT}`);
   console.log(`🔍 POST /api/analyze to analyze websites`);
});

export default app;
