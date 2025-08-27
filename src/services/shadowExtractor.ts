// services/shadowExtractor.ts

import { Shadow, ElementData } from "../types/design-system.types";

export function extractShadows(elements: ElementData[]): Shadow[] {
   const shadowMap = new Map<string, number>();

   elements.forEach((element) => {
      const { styles } = element;

      if (
         styles.boxShadow &&
         styles.boxShadow !== "none" &&
         !styles.boxShadow.includes("inset")
      ) {
         const normalizedShadow = normalizeShadow(styles.boxShadow);
         if (normalizedShadow) {
            shadowMap.set(
               normalizedShadow,
               (shadowMap.get(normalizedShadow) || 0) + 1
            );
         }
      }
   });

   // Convert to array and sort by usage
   const shadows = Array.from(shadowMap.entries())
      .map(([value, usage]) => ({
         name: generateShadowName(value),
         value,
         usage,
      }))
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 20); // Limit to top 20 shadows

   return shadows;
}

function normalizeShadow(shadow: string): string | null {
   try {
      // Remove rgb/rgba variations and normalize to a consistent format
      const normalized = shadow
         .replace(/rgba?KATEX_INLINE_OPEN[^)]+KATEX_INLINE_CLOSE/g, (match) => {
            // Convert rgba to hex if possible, or keep as is
            return match;
         })
         .trim();

      return normalized;
   } catch {
      return null;
   }
}

function generateShadowName(shadow: string): string {
   // Analyze shadow properties to generate a name
   const parts = shadow.split(" ").filter((p) => p);

   // Try to determine shadow size based on offset and blur
   const numbers = parts.map((p) => parseFloat(p)).filter((n) => !isNaN(n));

   if (numbers.length >= 3) {
      const offsetY = Math.abs(numbers[1] || 0);
      const blur = numbers[2] || 0;

      if (offsetY <= 1 && blur <= 2) return "xs";
      if (offsetY <= 2 && blur <= 4) return "sm";
      if (offsetY <= 4 && blur <= 6) return "md";
      if (offsetY <= 10 && blur <= 15) return "lg";
      if (offsetY <= 20 && blur <= 25) return "xl";
      if (offsetY > 20) return "2xl";
   }

   return `shadow-${Date.now()}`;
}
