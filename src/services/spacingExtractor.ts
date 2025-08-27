// services/spacingExtractor.ts

import { Spacing, ElementData } from "../types/design-system.types";

export function extractSpacing(elements: ElementData[]): Spacing {
   const spacing: Spacing = {
      base: null,
      scale: [],
      patterns: {
         containerPadding: null,
         sectionGap: null,
         componentGap: null,
         elementGap: null,
      },
   };

   const scaleSet = new Set<number>();
   const patterns = {
      containerPadding: [] as number[],
      sectionGap: [] as number[],
      componentGap: [] as number[],
      elementGap: [] as number[],
   };

   elements.forEach((element) => {
      const { styles, tagName } = element;

      // Extract padding values
      const paddingProps = [
         "paddingTop",
         "paddingRight",
         "paddingBottom",
         "paddingLeft",
      ] as const;
      paddingProps.forEach((prop) => {
         const value = styles[prop];
         if (value && value !== "0px" && value !== "auto") {
            const numValue = parseFloat(value);
            if (!isNaN(numValue) && numValue > 0) {
               scaleSet.add(Math.round(numValue)); // Round to avoid float precision issues

               // Categorize based on element type
               if (
                  tagName === "section" ||
                  tagName === "article" ||
                  tagName === "main"
               ) {
                  patterns.sectionGap.push(numValue);
               } else if (
                  tagName === "div" &&
                  styles.maxWidth &&
                  styles.maxWidth !== "none"
               ) {
                  patterns.containerPadding.push(numValue);
               } else if (
                  tagName === "header" ||
                  tagName === "footer" ||
                  tagName === "nav"
               ) {
                  patterns.containerPadding.push(numValue);
               }
            }
         }
      });

      // Extract margin values
      const marginProps = [
         "marginTop",
         "marginRight",
         "marginBottom",
         "marginLeft",
      ] as const;
      marginProps.forEach((prop) => {
         const value = styles[prop];
         if (value && value !== "0px" && value !== "auto") {
            const numValue = parseFloat(value);
            if (!isNaN(numValue) && numValue > 0) {
               scaleSet.add(Math.round(numValue));

               // Categorize based on element type
               if (tagName === "p" || tagName.match(/^h[1-6]$/)) {
                  patterns.elementGap.push(numValue);
               } else if (tagName === "section" || tagName === "article") {
                  patterns.sectionGap.push(numValue);
               } else if (
                  tagName === "button" ||
                  tagName === "input" ||
                  tagName === "form"
               ) {
                  patterns.componentGap.push(numValue);
               }
            }
         }
      });

      // Extract gap values (for flexbox/grid)
      if (styles.gap && styles.gap !== "normal" && styles.gap !== "0px") {
         const gapParts = styles.gap.split(" ");
         gapParts.forEach((part) => {
            const numValue = parseFloat(part);
            if (!isNaN(numValue) && numValue > 0) {
               scaleSet.add(Math.round(numValue));
               patterns.componentGap.push(numValue);
            }
         });
      }
   });

   // Convert scale to sorted array and filter out extreme values
   const allValues = Array.from(scaleSet)
      .filter((v) => v > 0 && v < 500) // Filter out extreme values
      .sort((a, b) => a - b);

   // Find base unit using GCD
   if (allValues.length > 0) {
      spacing.base = findBaseUnit(allValues);

      // Create a clean scale based on the base unit
      spacing.scale = generateScale(spacing.base, allValues);
   }

   // Calculate most common patterns
   (Object.keys(patterns) as Array<keyof typeof patterns>).forEach((key) => {
      const values = patterns[key];
      if (values.length > 0) {
         const mostCommon = getMostCommon(values);
         spacing.patterns[key] = `${Math.round(mostCommon)}px`;
      }
   });

   return spacing;
}

function findBaseUnit(values: number[]): number {
   // Filter to common spacing values (multiples of 2, 4, 5, 8)
   const commonBases = [2, 4, 5, 8, 10];
   const scores = commonBases.map((base) => {
      let score = 0;
      values.forEach((value) => {
         if (value % base === 0) score++;
      });
      return { base, score };
   });

   // Sort by score and return the best base
   scores.sort((a, b) => b.score - a.score);

   // If we have a clear winner, use it
   if (
      scores.length > 0 &&
      scores[0] &&
      scores[0].score > values.length * 0.5
   ) {
      return scores[0].base;
   }

   // Otherwise, calculate GCD
   const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
   const calculatedGcd = values.reduce((acc, val) => gcd(acc, val));

   // Make sure GCD is reasonable (between 2 and 16)
   if (calculatedGcd >= 2 && calculatedGcd <= 16) {
      return calculatedGcd;
   }

   return 4; // Default to 4px base
}

function generateScale(base: number, observedValues: number[]): number[] {
   const scale = new Set<number>();

   // Add observed values that are multiples of base
   observedValues.forEach((value) => {
      if (value % base === 0 || Math.abs((value % base) - base) < 2) {
         scale.add(Math.round(value));
      }
   });

   // Ensure we have a reasonable scale
   if (scale.size < 8) {
      // Add common multipliers
      [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32].forEach((multiplier) => {
         const value = base * multiplier;
         if (value <= 128) {
            scale.add(value);
         }
      });
   }

   return Array.from(scale).sort((a, b) => a - b);
}

function getMostCommon(arr: number[]): number {
   const frequency: Record<number, number> = {};
   let maxFreq = 0;
   let mostCommon = arr[0] || 0;

   arr.forEach((val) => {
      const rounded = Math.round(val);
      frequency[rounded] = (frequency[rounded] || 0) + 1;
      if (frequency[rounded] > maxFreq) {
         maxFreq = frequency[rounded];
         mostCommon = rounded;
      }
   });

   return mostCommon;
}
