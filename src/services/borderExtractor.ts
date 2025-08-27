// services/borderExtractor.ts

import { Borders, ElementData } from "../types/design-system.types";

export function extractBorders(elements: ElementData[]): Borders {
   const radiusSet = new Set<string>();
   const widthSet = new Set<string>();
   const radiusUsage = new Map<string, number>();
   const widthUsage = new Map<string, number>();

   elements.forEach((element) => {
      const { styles } = element;

      // Extract border radius
      if (
         styles.borderRadius &&
         styles.borderRadius !== "0px" &&
         styles.borderRadius !== "0"
      ) {
         const normalized = normalizeBorderRadius(styles.borderRadius);
         radiusSet.add(normalized);
         radiusUsage.set(normalized, (radiusUsage.get(normalized) || 0) + 1);
      }

      // Extract border width
      if (
         styles.borderWidth &&
         styles.borderWidth !== "0px" &&
         styles.borderWidth !== "0"
      ) {
         const normalized = normalizeBorderWidth(styles.borderWidth);
         widthSet.add(normalized);
         widthUsage.set(normalized, (widthUsage.get(normalized) || 0) + 1);
      }
   });

   // Sort values by usage
   const radiusValues = Array.from(radiusSet).sort(
      (a, b) => (radiusUsage.get(b) || 0) - (radiusUsage.get(a) || 0)
   );

   const widthValues = Array.from(widthSet).sort(
      (a, b) => (widthUsage.get(b) || 0) - (widthUsage.get(a) || 0)
   );

   return {
      radius: categorizeRadius(radiusValues),
      width: categorizeWidth(widthValues),
   };
}

function normalizeBorderRadius(radius: string): string {
   // Handle multiple values (e.g., "4px 4px 4px 4px")
   const parts = radius.split(" ").filter((p) => p);

   // If all values are the same, return single value
   if (parts.length > 0 && parts.every((p) => p === parts[0])) {
      return parts[0] as string;
   }

   return radius;
}

function normalizeBorderWidth(width: string): string {
   // Handle multiple values
   const parts = width.split(" ").filter((p) => p);

   // If all values are the same, return single value
   if (parts.length > 0 && parts.every((p) => p === parts[0])) {
      return parts[0]!;
   }

   return width;
}

function categorizeRadius(values: string[]): Record<string, string> {
   const categories: Record<string, string> = {
      none: "0",
   };

   values.forEach((value) => {
      const num = parseFloat(value);
      if (isNaN(num)) return;

      if (num > 0 && num <= 2) {
         categories["xs"] = value;
      } else if (num <= 4) {
         categories["sm"] = value;
      } else if (num <= 8) {
         categories["md"] = value;
      } else if (num <= 12) {
         categories["lg"] = value;
      } else if (num <= 16) {
         categories["xl"] = value;
      } else if (num <= 24) {
         categories["2xl"] = value;
      } else if (num >= 9999 || value.includes("50%")) {
         categories["full"] = value;
      }
   });

   return categories;
}

function categorizeWidth(values: string[]): Record<string, string> {
   const categories: Record<string, string> = {};

   values.forEach((value) => {
      const num = parseFloat(value);
      if (isNaN(num)) return;

      if (num === 1) {
         categories["thin"] = value;
      } else if (num === 2) {
         categories["default"] = value;
      } else if (num === 3) {
         categories["medium"] = value;
      } else if (num === 4) {
         categories["thick"] = value;
      } else if (num >= 5) {
         categories["bold"] = value;
      }
   });

   // Ensure we have at least a default
   if (!categories["default"] && values.length > 0) {
      categories["default"] = values[0] || "";
   }

   return categories;
}
