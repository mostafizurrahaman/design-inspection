import puppeteer, { Browser } from "puppeteer";
import convert from "color-convert";
import colorNamer from "color-namer";

// --- INTERFACES ---

// Raw data extracted from the browser
interface ComputedStyles {
   fontFamily: string;
   fontSize: string;
   fontWeight: string;
   lineHeight: string;
   letterSpacing: string;
   fontStyle: string;
   color: string;
   backgroundColor: string;
   borderColor: string;
   padding: string;
   margin: string;
   boxShadow: string;
   textShadow: string;
   animation: string;
   transition: string;
}

// Represents a single HTML element with its styles
interface TypographyElement {
   tag?: string;
   styles: ComputedStyles;
   text: string;
   className: string;
   id: string;
}

// The structure of the raw data collected by Puppeteer
interface RawDesignTokens {
   // A flat list of all visible elements for easier processing
   allElements: TypographyElement[];
   // A simple list of unique font family names
   uniqueFontNames: string[];
}

// --- NEW INTERFACES FOR THE DESIRED OUTPUT FORMAT ---

interface FormattedColor {
   rgb: string;
   hex: string;
   hsl: string;
   name: string;
}

// This interface was previously modified to remove color properties.
interface FormattedTypography {
   tags: string[];
   fontFamily: string;
   fontWeight: string;
   fontSize: string;
   lineHeight: string;
   letterSpacing: string;
   fontStyle: string;
}

interface FormattedSpacing {
   tags: string[];
   padding: string;
   margin: string;
}

interface FormattedFont {
   tags: string[];
   fontFamily: string;
   fontWeight: string;
   lineHeight: string;
   letterSpacing: string;
   fontStyle: string;
}

interface FormattedTagBasedColor {
   tag: string;
   color: FormattedColor;
   type: "text" | "background" | "border";
}

// The final, desired output structure
interface FormattedAnalysisResult {
   typography: FormattedTypography[];
   spacing: FormattedSpacing[];
   colors: FormattedColor[];
   fonts: FormattedFont[];
   tagBasedColors: FormattedTagBasedColor[];
   uniqueFonts: string[];
   shadows: string[];
   animations: string[];
}

export class WebsiteAnalyzer {
   private browser: Browser | null = null;

   /**
    * Initializes the Puppeteer browser instance if it doesn't already exist.
    */
   async initBrowser(): Promise<Browser> {
      if (!this.browser) {
         console.log("🚀 Launching Puppeteer browser...");
         this.browser = await puppeteer.launch({
            headless: true,
            args: [
               "--no-sandbox",
               "--disable-setuid-sandbox",
               "--disable-dev-shm-usage",
               "--disable-accelerated-2d-canvas",
               "--no-first-run",
               "--no-zygote",
               "--disable-gpu",
            ],
         });
      }
      return this.browser;
   }

   /**
    * Closes the Puppeteer browser instance.
    */
   async closeBrowser(): Promise<void> {
      if (this.browser) {
         console.log("🚪 Closing Puppeteer browser...");
         await this.browser.close();
         this.browser = null;
      }
   }

   /**
    * Converts a CSS color string (like 'rgb(0, 0, 0)') to a detailed color object.
    * Returns null for invalid or transparent colors.
    */
   private convertColor(rgbString: string): FormattedColor | null {
      try {
         // Ignore invalid, transparent, or initial color values
         if (
            !rgbString ||
            rgbString === "none" ||
            rgbString === "rgba(0, 0, 0, 0)" ||
            rgbString === "initial"
         ) {
            return null;
         }

         const rgbValues = rgbString.match(/\d+/g)?.map(Number);
         if (!rgbValues || rgbValues.length < 3) return null; // Not a valid RGB string

         const [r, g, b] = rgbValues;
         const hex =
            "#" + convert.rgb.hex(r as number, g as number, b as number);
         const hslRaw = convert.rgb.hsl(r as number, g as number, b as number);
         const hsl = `hsl(${hslRaw[0]}, ${hslRaw[1]}%, ${hslRaw[2]}%)`;

         // Find the closest color name from the library
         const name = colorNamer(hex);

         return {
            rgb: `rgb(${r}, ${g}, ${b})`,
            hex,
            hsl,
            name: name.ntc[0]?.name || name.pantone[0]?.name || "N/A",
         };
      } catch (e) {
         console.warn(`Could not parse color: ${rgbString}`);
         return null;
      }
   }

   /**
    * Takes a CSS font-family string and extracts only the primary font.
    * e.g., '"Helvetica Neue", Arial, sans-serif' becomes 'Helvetica Neue'
    */
   private getPrimaryFont(fontStack: string): string {
      if (!fontStack) return "";
      return fontStack.split(",")?.[0]?.trim().replace(/['"]/g, "")!;
   }

   /**
    * Takes the raw analysis data from Puppeteer and transforms it into the desired final format.
    */
   private formatAnalysis(data: RawDesignTokens): FormattedAnalysisResult {
      const { allElements, uniqueFontNames } = data;

      const typographyMap = new Map<string, FormattedTypography>();
      const spacingMap = new Map<string, FormattedSpacing>();
      const fontsMap = new Map<string, FormattedFont>();
      const colorsSet = new Set<string>();
      const tagBasedColorsMap = new Map<string, FormattedTagBasedColor>();
      const shadowsSet = new Set<string>();
      const animationsSet = new Set<string>();

      allElements.forEach((el) => {
         const { styles, tag = "unknown" } = el;

         // --- MODIFIED LOGIC: Use only the primary font ---
         const primaryFont = this.getPrimaryFont(styles.fontFamily);

         // 1. Process and group unique TYPOGRAPHY styles (without color properties)
         const typoKey = `${primaryFont}-${styles.fontWeight}-${styles.fontSize}-${styles.lineHeight}-${styles.letterSpacing}-${styles.fontStyle}`;
         if (!typographyMap.has(typoKey)) {
            typographyMap.set(typoKey, {
               tags: [tag],
               fontFamily: primaryFont, // Use the cleaned primary font
               fontWeight: styles.fontWeight,
               fontSize: styles.fontSize,
               lineHeight: styles.lineHeight,
               letterSpacing: styles.letterSpacing,
               fontStyle: styles.fontStyle,
            });
         } else {
            const existing = typographyMap.get(typoKey)!;
            if (!existing.tags.includes(tag)) {
               existing.tags.push(tag);
            }
         }

         // 2. Process and group unique SPACING styles
         const spacingKey = `${styles.padding}-${styles.margin}`;
         if (styles.padding !== "0px" || styles.margin !== "0px") {
            if (!spacingMap.has(spacingKey)) {
               spacingMap.set(spacingKey, {
                  tags: [tag],
                  padding: styles.padding,
                  margin: styles.margin,
               });
            } else {
               const existing = spacingMap.get(spacingKey)!;
               if (!existing.tags.includes(tag)) {
                  existing.tags.push(tag);
               }
            }
         }

         // 3. Process and group unique FONT styles (a subset of typography)
         const fontKey = `${primaryFont}-${styles.fontWeight}-${styles.lineHeight}-${styles.letterSpacing}-${styles.fontStyle}`;
         if (!fontsMap.has(fontKey)) {
            fontsMap.set(fontKey, {
               tags: [tag],
               fontFamily: primaryFont, // Use the cleaned primary font
               fontWeight: styles.fontWeight,
               lineHeight: styles.lineHeight,
               letterSpacing: styles.letterSpacing,
               fontStyle: styles.fontStyle,
            });
         } else {
            const existing = fontsMap.get(fontKey)!;
            if (!existing.tags.includes(tag)) {
               existing.tags.push(tag);
            }
         }

         // 4. Collect all color strings for the global color palette
         if (styles.color) colorsSet.add(styles.color);
         if (styles.backgroundColor) colorsSet.add(styles.backgroundColor);
         if (styles.borderColor) colorsSet.add(styles.borderColor);

         // 5. Process and group TAG-BASED COLORS
         const processTagColor = (
            colorString: string,
            type: "text" | "background" | "border"
         ) => {
            const formattedColor = this.convertColor(colorString);
            if (formattedColor) {
               // A unique key based on tag, color type, and the RGB value
               const key = `${tag}-${type}-${formattedColor.rgb}`;
               if (!tagBasedColorsMap.has(key)) {
                  tagBasedColorsMap.set(key, {
                     tag,
                     color: formattedColor,
                     type,
                  });
               }
            }
         };
         processTagColor(styles.color, "text");
         processTagColor(styles.backgroundColor, "background");
         processTagColor(styles.borderColor, "border");

         // 6. Collect unique SHADOWS and ANIMATIONS
         if (styles.boxShadow && styles.boxShadow !== "none")
            shadowsSet.add(styles.boxShadow);
         if (styles.textShadow && styles.textShadow !== "none")
            shadowsSet.add(styles.textShadow);
         if (
            styles.animation &&
            styles.animation !== "none" &&
            !styles.animation.includes("0s")
         )
            animationsSet.add(styles.animation);
         if (
            styles.transition &&
            styles.transition !== "none" &&
            !styles.transition.includes("0s")
         )
            animationsSet.add(styles.transition);
      });

      // Convert the color Set into the final array of FormattedColor objects
      const finalColors = Array.from(colorsSet)
         .map((c) => this.convertColor(c))
         .filter((c): c is FormattedColor => c !== null); // Type guard to remove nulls

      // Remove duplicate colors from the final list
      const uniqueFinalColors = Array.from(
         new Map(finalColors.map((c) => [c.hex, c])).values()
      );

      return {
         typography: Array.from(typographyMap.values()),
         spacing: Array.from(spacingMap.values()),
         colors: uniqueFinalColors,
         fonts: Array.from(fontsMap.values()),
         tagBasedColors: Array.from(tagBasedColorsMap.values()),
         uniqueFonts: uniqueFontNames,
         shadows: Array.from(shadowsSet),
         animations: Array.from(animationsSet),
      };
   }

   /**
    * The main method to analyze a website.
    * It navigates to a URL, extracts raw data using Puppeteer, and then formats it.
    */
   async analyzeWebsite(url: string): Promise<FormattedAnalysisResult> {
      const browser = await this.initBrowser();
      const page = await browser.newPage();

      try {
         console.log(`🌐 Navigating to ${url}...`);
         await page.setViewport({ width: 1920, height: 1080 });
         await page.setUserAgent(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
         );
         await page.goto(url, { waitUntil: "networkidle2", timeout: 45000 });

         // Small delay for any lazy-loaded content to appear
         await new Promise((resolve) => setTimeout(resolve, 3000));
         console.log("🔍 Extracting design tokens from the page...");

         // This part runs INSIDE the browser context
         const rawAnalysis: RawDesignTokens = await page.evaluate(() => {
            const getComputedStylesForElement = (
               element: Element
            ): ComputedStyles => {
               const styles = window.getComputedStyle(element);
               return {
                  fontFamily: styles.fontFamily,
                  fontSize: styles.fontSize,
                  fontWeight: styles.fontWeight,
                  lineHeight: styles.lineHeight,
                  letterSpacing: styles.letterSpacing,
                  fontStyle: styles.fontStyle,
                  color: styles.color,
                  backgroundColor: styles.backgroundColor,
                  borderColor: styles.borderColor,
                  padding: styles.padding,
                  margin: styles.margin,
                  boxShadow: styles.boxShadow,
                  textShadow: styles.textShadow,
                  animation: styles.animation,
                  transition: styles.transition,
               };
            };

            const collectedData: RawDesignTokens = {
               allElements: [],
               uniqueFontNames: [],
            };

            const allElements = document.querySelectorAll(
               "body *:not(script):not(style):not(path):not(svg *)"
            );
            const fontsSet = new Set<string>();

            allElements.forEach((element) => {
               // Skip elements that are not visible to the user
               const rect = element.getBoundingClientRect();
               if (
                  rect.width === 0 ||
                  rect.height === 0 ||
                  window.getComputedStyle(element).display === "none"
               ) {
                  return;
               }

               const styles = getComputedStylesForElement(element);
               const tagName = element.tagName.toLowerCase();

               const elementData: TypographyElement = {
                  tag: tagName,
                  styles,
                  text: element.textContent?.trim().substring(0, 50) || "",
                  className:
                     typeof element.className === "string"
                        ? element.className
                        : "",
                  id: element.id || "",
               };

               collectedData.allElements.push(elementData);

               // Collect unique font families
               if (styles.fontFamily) {
                  fontsSet.add(styles.fontFamily);
               }
            });

            // --- MODIFIED LOGIC: Process font stacks to get only the primary font name ---
            collectedData.uniqueFontNames = [
               ...new Set(
                  Array.from(fontsSet).map((fontStack) =>
                     // Split by comma, take the first item, and clean it up
                     fontStack.split(",")?.[0]?.trim().replace(/['"]/g, "")!
                  )
               ),
            ];

            return collectedData;
         });

         console.log(
            `📊 Formatting ${rawAnalysis.allElements.length} elements...`
         );
         // This part runs in Node.js, transforming the data into the desired structure
         const formattedResult = this.formatAnalysis(rawAnalysis);

         return formattedResult;
      } catch (error) {
         console.error(`❌ An error occurred during analysis: ${error}`);
         throw new Error(
            `Failed to analyze website: ${
               error instanceof Error ? error.message : "Unknown error"
            }`
         );
      } finally {
         await page.close();
      }
   }
}

// --- MAIN EXECUTION LOGIC ---

// Create a single instance of the analyzer
const webAnalyzer = new WebsiteAnalyzer();

// Add listeners for graceful shutdown on Ctrl+C (SIGINT) or termination signals
process.on("SIGINT", async () => {
   console.log("\n🔄 SIGINT received. Shutting down gracefully...");
   await webAnalyzer.closeBrowser();
   process.exit(0);
});

process.on("SIGTERM", async () => {
   console.log("\n🔄 SIGTERM received. Shutting down gracefully...");
   await webAnalyzer.closeBrowser();
   process.exit(0);
});
