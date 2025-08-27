// services/typographyExtractor.ts

import {
   Typography,
   TextStyle,
   ElementData,
} from "../types/design-system.types";

interface FontMap {
   family: string;
   variants: Map<string, VariantData>;
   usage: number;
}

interface VariantData {
   weight: string | number;
   style: string;
   usage: number;
   contexts: Set<string>;
}

export function extractTypography(elements: ElementData[]): Typography {
   const typography: Typography = {
      scale: { sizes: [], base: null, ratio: null },
      fonts: [],
      styles: {
         heading: {},
         body: {},
         ui: {},
      },
   };

   const fontMap = new Map<string, FontMap>();
   const sizeSet = new Set<number>();

   // Process each element
   elements.forEach((element) => {
      const { styles, tagName, text } = element;

      // Extract font families
      if (styles.fontFamily) {
         const fontFamily = cleanFontFamily(styles.fontFamily);

         if (!fontMap.has(fontFamily)) {
            fontMap.set(fontFamily, {
               family: fontFamily,
               variants: new Map(),
               usage: 0,
            });
         }

         const font = fontMap.get(fontFamily)!;
         font.usage++;

         // Track variants
         const weight = styles.fontWeight || "400";
         const fontStyle = styles.fontStyle || "normal";
         const variantKey = `${weight}-${fontStyle}`;

         if (!font.variants.has(variantKey)) {
            font.variants.set(variantKey, {
               weight,
               style: fontStyle,
               usage: 0,
               contexts: new Set(),
            });
         }

         const variant = font.variants.get(variantKey)!;
         variant.usage++;
         variant.contexts.add(tagName);
      }

      // Extract font sizes
      if (styles.fontSize) {
         const size = parseFloat(styles.fontSize);
         if (!isNaN(size)) {
            sizeSet.add(size);
         }
      }

      // Categorize text styles
      if (tagName.match(/^h[1-6]$/)) {
         typography.styles.heading[tagName] = createTextStyle(styles, text);
      } else if (
         tagName === "p" ||
         (tagName === "div" && text && text.length > 50)
      ) {
         if (!typography.styles.body["base"]) {
            typography.styles.body["base"] = createTextStyle(styles);
         } else if (
            styles.fontSize &&
            parseFloat(styles.fontSize) <
               parseFloat(typography.styles.body["base"].fontSize)
         ) {
            typography.styles.body["small"] = createTextStyle(styles);
         } else if (
            styles.fontSize &&
            parseFloat(styles.fontSize) >
               parseFloat(typography.styles.body["base"].fontSize)
         ) {
            typography.styles.body["large"] = createTextStyle(styles);
         }
      } else if (
         tagName === "button" ||
         tagName === "a" ||
         tagName === "input" ||
         tagName === "label"
      ) {
         typography.styles.ui[tagName] = createTextStyle(styles);
      }
   });

   // Calculate type scale
   const sizes = Array.from(sizeSet).sort((a, b) => a - b);
   if (sizes.length > 1) {
      typography.scale.base = `${findBaseSize(sizes)}px`;
      typography.scale.ratio = calculateRatio(sizes);
      typography.scale.sizes = sizes.map((s) => `${s}px`);
   }

   // Convert Maps to arrays and sort by usage
   const sortedFonts = Array.from(fontMap.values()).sort(
      (a, b) => b.usage - a.usage
   );

   typography.fonts = sortedFonts.map((font, index) => ({
      id: `font-${index + 1}`,
      family: font.family,
      fallbacks: extractFallbacks(font.family),
      variants: Array.from(font.variants.values())
         .sort((a, b) => b.usage - a.usage)
         .map((v) => ({
            weight: v.weight,
            style: v.style,
            usage: v.usage,
            contexts: Array.from(v.contexts),
         })),
   }));

   return typography;
}

function createTextStyle(
   styles: ElementData["styles"],
   text?: string
): TextStyle {
   const result: TextStyle = {
      fontSize: styles.fontSize || "16px",
      fontWeight: styles.fontWeight || "400",
      lineHeight: styles.lineHeight || "normal",
      letterSpacing: styles.letterSpacing || "normal",
      fontFamily: cleanFontFamily(styles.fontFamily || "sans-serif"),
   };

   if (styles.textTransform) {
      result.textTransform = styles.textTransform;
   }

   if (text) {
      result.samples = [text];
   }

   return result;
}

function cleanFontFamily(fontFamily: string): string {
   return fontFamily
      .replace(/['"]/g, "")
      .split(",")
      .map((f) => f.trim())
      .filter((f) => !f.includes("var(")) // Remove CSS variables
      .join(", ");
}

function extractFallbacks(fontFamily: string): string[] {
   return fontFamily
      .split(",")
      .map((f) => f.trim().replace(/['"]/g, ""))
      .slice(1)
      .filter((f) => f.length > 0);
}

function findBaseSize(sizes: number[]): number {
   // Find the most common size around 14-18px (likely body text)
   const bodySizes = sizes.filter((s) => s >= 14 && s <= 18);
   if (bodySizes.length > 0) {
      // Return the median of body sizes
      const mid = Math.floor(bodySizes.length / 2);
      return bodySizes[mid] || 16;
   }
   return 16; // Default fallback
}

function calculateRatio(sizes: number[]): number {
   const ratios: number[] = [];
   for (let i = 1; i < sizes.length; i++) {
      const current = sizes[i];
      const previous = sizes[i - 1];
      if (current !== undefined && previous !== undefined) {
         const ratio = current / previous;
         if (ratio > 1) {
            // Only consider increasing ratios
            ratios.push(ratio);
         }
      }
   }

   if (ratios.length === 0) return 1.25; // Default ratio

   const avgRatio = ratios.reduce((a, b) => a + b, 0) / ratios.length;

   // Round to nearest common ratio
   const commonRatios = [
      { value: 1.067, name: "Minor Second" },
      { value: 1.125, name: "Major Second" },
      { value: 1.2, name: "Minor Third" },
      { value: 1.25, name: "Major Third" },
      { value: 1.333, name: "Perfect Fourth" },
      { value: 1.414, name: "Augmented Fourth" },
      { value: 1.5, name: "Perfect Fifth" },
      { value: 1.618, name: "Golden Ratio" },
   ];

   const closest = commonRatios.reduce((prev, curr) =>
      Math.abs(curr.value - avgRatio) < Math.abs(prev.value - avgRatio)
         ? curr
         : prev
   );

   return closest.value;
}
