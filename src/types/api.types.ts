// types/api.types.ts

import { DesignSystemOutput } from "./design-system.types";

export interface AnalyzeRequest {
   url: string;
   options?: {
      timeout?: number;
      waitUntil?: "load" | "domcontentloaded" | "networkidle0" | "networkidle2";
      screenshot?: boolean;
      fullPage?: boolean;
      maxElements?: number;
   };
}

export interface AnalyzeResponse {
   success: boolean;
   data?: DesignSystemOutput;
   error?: string;
   message?: string;
   timestamp: string;
}

export interface HealthCheckResponse {
   status: "healthy" | "unhealthy";
   service: string;
   timestamp: string;
   uptime?: number;
   memory?: NodeJS.MemoryUsage;
}

export interface ErrorResponse {
   success: false;
   error: string;
   message?: string;
   statusCode?: number;
   timestamp: string;
}
