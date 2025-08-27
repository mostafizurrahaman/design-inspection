// services/colorExtractor.ts

import chroma from "chroma-js";
import { Colors, Gradient, ElementData } from "../types/design-system.types";

interface ColorData {
   value: string;
   usage: number;
   contexts: Set<string>;
   properties: string[];
}

export function extractColors(
   elements: ElementData[],
   customProperties: Record<string, string>
): Colors {
   const colors: Colors = {
      primitives: {},
      semantic: {
         primary: { base: "" },
         secondary: { base: "" },
         background: {},
         text: {},
         border: {},
         status: {
            success: "#10b981",
            warning: "#f59e0b",
            error: "#ef4444",
            info: "#3b82f6",
         },
      },
      gradients: [],
   };

   const colorMap = new Map<string, ColorData>();
   const gradientMap = new Map<string, Gradient>();

   // Extract colors from elements
   elements.forEach((element) => {
      const { styles } = element;

      // Text colors
      if (styles.color && isValidColor(styles.color)) {
         addColor(colorMap, styles.color, "text");
      }

      // Background colors
      if (styles.backgroundColor && isValidColor(styles.backgroundColor)) {
         addColor(colorMap, styles.backgroundColor, "background");
      }

      // Border colors
      if (styles.borderColor && isValidColor(styles.borderColor)) {
         addColor(colorMap, styles.borderColor, "border");
      }

      // Extract gradients from background-image
      if (
         styles.backgroundImage &&
         styles.backgroundImage.includes("gradient")
      ) {
         const gradient = parseGradient(styles.backgroundImage);
         if (gradient) {
            const key = gradient.stops.join("-");
            if (gradientMap.has(key)) {
               gradientMap.get(key)!.usage++;
            } else {
               gradientMap.set(key, gradient);
            }
         }
      }

      // Box shadow colors
      if (styles.boxShadow && styles.boxShadow !== "none") {
         const shadowColors = extractShadowColors(styles.boxShadow);
         shadowColors.forEach((color) => addColor(colorMap, color, "shadow"));
      }
   });

   // Process CSS custom properties
   if (customProperties) {
      Object.entries(customProperties).forEach(([prop, value]) => {
         if (isColor(value)) {
            addColor(colorMap, value, "custom-property", prop);
         }
      });
   }

   // Organize colors into semantic groups
   const textColors: Array<[string, ColorData]> = [];
   const backgroundColors: Array<[string, ColorData]> = [];
   const borderColors: Array<[string, ColorData]> = [];
   const accentColors: Array<[string, ColorData]> = [];

   colorMap.forEach((colorData, colorValue) => {
      try {
         const hex = toHex(colorValue);
         const [hue, saturation, lightness] = chroma(hex).hsl();

         // Categorize by context
         if (colorData.contexts.has("text")) {
            textColors.push([hex, colorData]);
         }
         if (colorData.contexts.has("background")) {
            backgroundColors.push([hex, colorData]);
         }
         if (colorData.contexts.has("border")) {
            borderColors.push([hex, colorData]);
         }

         // Find accent colors (saturated non-text colors)
         if ((saturation || 0) > 0.3 && !colorData.contexts.has("text")) {
            accentColors.push([hex, colorData]);
         }

         // Create color scales
         const colorName = getColorName(
            hue || 0,
            saturation || 0,
            lightness || 0.5
         );
         if (!colors.primitives[colorName]) {
            colors.primitives[colorName] = {};
         }

         const shade = getShadeNumber(lightness || 0.5);
         colors.primitives[colorName][shade] = hex;
      } catch (e) {
         console.error("Error processing color:", colorValue);
      }
   });

   // Sort by usage and assign semantic colors
   textColors.sort((a, b) => b[1].usage - a[1].usage);
   backgroundColors.sort((a, b) => b[1].usage - a[1].usage);
   borderColors.sort((a, b) => b[1].usage - a[1].usage);
   accentColors.sort((a, b) => b[1].usage - a[1].usage);

   // Assign text colors
   if (textColors.length > 0) {
      colors.semantic.text["primary"] = textColors?.[0]?.[0]!;
      if (textColors.length > 1)
         colors.semantic.text["secondary"] = textColors?.[1]?.[0]!;
      if (textColors.length > 2)
         colors.semantic.text["tertiary"] = textColors?.[2]?.[0]!;
   }

   // Assign background colors
   if (backgroundColors.length > 0) {
      colors.semantic.background["primary"] = backgroundColors?.[0]?.[0]!;
      if (backgroundColors.length > 1)
         colors.semantic.background["secondary"] = backgroundColors?.[1]?.[0]!;
      if (backgroundColors.length > 2)
         colors.semantic.background["tertiary"] = backgroundColors?.[2]?.[0]!;
   }

   // Assign border colors
   if (borderColors.length > 0) {
      colors.semantic.border["default"] = borderColors?.[0]?.[0]!;
      if (borderColors.length > 1)
         colors.semantic.border["hover"] = borderColors?.[1]?.[0]!;
   }

   // Assign primary and secondary colors from accent colors
   if (accentColors.length > 0) {
      colors.semantic.primary.base = accentColors?.[0]?.[0]!;
      colors.semantic.primary.usage = accentColors?.[0]?.[1]?.usage || 0;
   }
   if (accentColors.length > 1) {
      colors.semantic.secondary.base = accentColors?.[1]?.[0]!;
      colors.semantic.secondary.usage = accentColors?.[1]?.[1]?.usage || 0;
   }

   // Convert gradients map to array
   colors.gradients = Array.from(gradientMap.values())
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 10); // Limit to top 10 gradients

   return colors;
}

function isValidColor(color: string): boolean {
   return (
      color !== "rgba(0, 0, 0, 0)" &&
      color !== "transparent" &&
      color !== "inherit" &&
      color !== "initial" &&
      color !== "unset"
   );
}

function addColor(
   colorMap: Map<string, ColorData>,
   color: string,
   context: string,
   propertyName?: string
): void {
   if (!isValidColor(color)) return;

   const normalized = normalizeColor(color);
   if (!normalized) return;

   if (!colorMap.has(normalized)) {
      colorMap.set(normalized, {
         value: normalized,
         usage: 0,
         contexts: new Set(),
         properties: [],
      });
   }

   const colorData = colorMap.get(normalized)!;
   colorData.usage++;
   colorData.contexts.add(context);
   if (propertyName) {
      colorData.properties.push(propertyName);
   }
}

function normalizeColor(color: string): string | null {
   try {
      return chroma(color).hex();
   } catch (e) {
      return null;
   }
}

function isColor(value: string): boolean {
   try {
      chroma(value);
      return true;
   } catch {
      return false;
   }
}

function toHex(color: string): string {
   try {
      return chroma(color).hex();
   } catch {
      return color;
   }
}

function getColorName(
   hue: number,
   saturation: number,
   _lightness: number
): string {
   // Grayscale
   if (saturation < 0.1) return "gray";

   // Color wheel segments
   if (hue < 15 || hue >= 345) return "red";
   if (hue < 45) return "orange";
   if (hue < 75) return "yellow";
   if (hue < 150) return "green";
   if (hue < 200) return "cyan";
   if (hue < 250) return "blue";
   if (hue < 290) return "purple";
   if (hue < 345) return "pink";

   return "gray";
}

function getShadeNumber(lightness: number): string {
   if (lightness > 0.95) return "50";
   if (lightness > 0.85) return "100";
   if (lightness > 0.75) return "200";
   if (lightness > 0.65) return "300";
   if (lightness > 0.55) return "400";
   if (lightness > 0.45) return "500";
   if (lightness > 0.35) return "600";
   if (lightness > 0.25) return "700";
   if (lightness > 0.15) return "800";
   return "900";
}

function parseGradient(gradientString: string): Gradient | null {
   try {
      const linearMatch = gradientString.match(
         /linear-gradientKATEX_INLINE_OPEN([^)]+)KATEX_INLINE_CLOSE/
      );
      const radialMatch = gradientString.match(
         /radial-gradientKATEX_INLINE_OPEN([^)]+)KATEX_INLINE_CLOSE/
      );

      if (linearMatch && linearMatch[1]) {
         const parts = linearMatch[1].split(",").map((p) => p.trim());
         const colors: string[] = [];
         let angle = "180deg";

         parts.forEach((part) => {
            if (
               part.includes("deg") ||
               part.includes("turn") ||
               part.includes("rad")
            ) {
               angle = part;
            } else if (isColor(part.split(" ")[0] || "")) {
               colors.push(toHex(part.split(" ")[0] || ""));
            }
         });

         if (colors.length >= 2) {
            return {
               name: `gradient-${Date.now()}`,
               type: "linear",
               angle,
               stops: colors,
               usage: 1,
            };
         }
      }

      if (radialMatch && radialMatch[1]) {
         const parts = radialMatch[1].split(",").map((p) => p.trim());
         const colors: string[] = [];

         parts.forEach((part) => {
            const colorMatch = part.match(
               /(#[0-9a-f]{3,6}|rgba?KATEX_INLINE_OPEN[^)]+KATEX_INLINE_CLOSE|[a-z]+)/i
            );
            if (colorMatch && isColor(colorMatch[0])) {
               colors.push(toHex(colorMatch[0]));
            }
         });

         if (colors.length >= 2) {
            return {
               name: `gradient-${Date.now()}`,
               type: "radial",
               stops: colors,
               usage: 1,
            };
         }
      }
   } catch (e) {
      console.error("Error parsing gradient:", e);
   }

   return null;
}

function extractShadowColors(boxShadow: string): string[] {
   const colors: string[] = [];
   const shadowRegex =
      /rgba?KATEX_INLINE_OPEN[^)]+KATEX_INLINE_CLOSE|#[0-9a-f]{3,8}/gi;
   const matches = boxShadow.match(shadowRegex);

   if (matches) {
      matches.forEach((match) => {
         if (isColor(match)) {
            colors.push(match);
         }
      });
   }

   return colors;
}
