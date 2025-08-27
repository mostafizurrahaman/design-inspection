// routes/analyze.ts

import { Router, Request, Response } from "express";
import DesignScraper from "../services/designScraper";
import { extractTypography } from "../services/typographyExtractor";
import { extractColors } from "../services/colorExtractor";
import { extractSpacing } from "../services/spacingExtractor";
import { extractShadows } from "../services/shadowExtractor";
import { extractBorders } from "../services/borderExtractor";
import { DesignSystemOutput, ScrapedData } from "../types/design-system.types";
import { AnalyzeRequest, AnalyzeResponse } from "../types/api.types";

const router = Router();

// POST /api/comprehensive-analyze
router.post(
   "/comprehensive-analyze",
   async (
      req: Request<{}, {}, AnalyzeRequest>,
      res: Response<AnalyzeResponse>
   ) => {
      const { url, options = {} } = req.body;

      // Validate URL
      if (!url || typeof url !== "string") {
         return res.status(400).json({
            success: false,
            error: "URL is required",
            message: "Please provide a valid URL to analyze",
            timestamp: new Date().toISOString(),
         });
      }

      // Validate URL format
      try {
         const urlObj = new URL(url);
         if (!["http:", "https:"].includes(urlObj.protocol)) {
            throw new Error("Invalid protocol");
         }
      } catch {
         return res.status(400).json({
            success: false,
            error: "Invalid URL format",
            message: "Please provide a valid HTTP/HTTPS URL",
            timestamp: new Date().toISOString(),
         });
      }

      const scraper = new DesignScraper(options);

      try {
         // Initialize scraper
         console.log("🚀 Initializing scraper...");
         await scraper.init();

         // Scrape the website
         console.log(`🔍 Scraping ${url}...`);
         const scrapedData = await scraper.scrapeWebsite(url);

         // Extract design tokens in parallel for better performance
         console.log("🎨 Extracting design tokens...");
         const [typography, colors, spacing, shadows, borders] =
            await Promise.all([
               extractTypography(scrapedData.elements),
               extractColors(
                  scrapedData.elements,
                  scrapedData.customProperties
               ),
               extractSpacing(scrapedData.elements),
               extractShadows(scrapedData.elements),
               extractBorders(scrapedData.elements),
            ]);

         // Build final output
         const output: DesignSystemOutput = buildOutput({
            url,
            scrapedData,
            typography,
            colors,
            spacing,
            shadows,
            borders,
         });

         console.log("✅ Analysis complete!");

         // Send success response
         return res.status(200).json({
            success: true,
            data: output,
            timestamp: new Date().toISOString(),
         });
      } catch (error) {
         console.error("❌ Analysis error:", error);

         // Send error response
         return res.status(500).json({
            success: false,
            error:
               error instanceof Error
                  ? error.message
                  : "Unknown error occurred",
            message: "Failed to analyze the website. Please try again.",
            timestamp: new Date().toISOString(),
         });
      } finally {
         // Always close the scraper
         try {
            await scraper.close();
            console.log("🔒 Scraper closed successfully");
         } catch (closeError) {
            console.error("Error closing scraper:", closeError);
         }
      }
   }
);

// GET /api/analyze/health
router.get("/analyze/health", (_req: Request, res: Response) => {
   res.status(200).json({
      status: "healthy",
      service: "design-analyzer",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
   });
});

// Helper function to build the output
function buildOutput(params: {
   url: string;
   scrapedData: ScrapedData;
   typography: any;
   colors: any;
   spacing: any;
   shadows: any;
   borders: any;
}): DesignSystemOutput {
   const { url, scrapedData, typography, colors, spacing, shadows, borders } =
      params;

   // Calculate unique colors count
   const uniqueColorsCount = Object.keys(colors.primitives).reduce(
      (acc, key) => acc + Object.keys(colors.primitives[key]).length,
      0
   );

   const result: DesignSystemOutput = {
      meta: {
         url,
         analyzedAt: new Date().toISOString(),
         title: scrapedData.meta.title || "Untitled",
         performance: {
            totalStyles: scrapedData.stylesheets.reduce(
               (acc, s) => acc + s.rules.length,
               0
            ),
            uniqueColors: uniqueColorsCount,
            fontFamilies: typography.fonts.length,
            cssFiles: scrapedData.stylesheets.length,
         },
      },
      typography,
      colors,
      spacing,
      layout: {
         breakpoints: {
            sm: "640px",
            md: "768px",
            lg: "1024px",
            xl: "1280px",
            "2xl": "1536px",
         },
         container: {
            maxWidth: "1280px",
            padding: spacing.patterns.containerPadding || "16px",
            centered: true,
         },
         grid: {
            columns: 12,
            gap: spacing.patterns.componentGap || "24px",
         },
      },
      shadows,
      borders,
      animations: {
         transitions: {
            fast: "150ms ease",
            base: "250ms ease",
            slow: "350ms ease",
            properties: [
               "color",
               "background-color",
               "border-color",
               "opacity",
               "transform",
            ],
         },
         keyframes: [],
      },
      accessibility: {
         contrastRatios: {},
         focusIndicators: {
            present: true,
            style: "outline",
            color: colors.semantic.primary.base || "#3b82f6",
         },
      },
      stats: {
         uniqueColors: uniqueColorsCount,
         uniqueFonts: typography.fonts.length,
         totalElements: scrapedData.elements.length,
         cssRules: scrapedData.stylesheets.reduce(
            (acc, s) => acc + s.rules.length,
            0
         ),
         mediaQueries: 0, // TODO: Extract media queries
         customProperties: Object.keys(scrapedData.customProperties).length,
      },
   };

   // Add optional properties if they exist
   if (scrapedData.meta.favicon) {
      result.meta.favicon = scrapedData.meta.favicon;
   }
   if (scrapedData.meta.viewport) {
      result.meta.viewport = scrapedData.meta.viewport;
   }
   if (scrapedData.screenshot) {
      result.meta.screenshot = scrapedData.screenshot;
   }

   return result;
}

const comprehensiveAnalyze = router;

export default comprehensiveAnalyze;
