import fs from "fs";
import puppeteer, { Browser } from "puppeteer";

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
}

interface TypographyElement {
   tag?: string;
   styles: ComputedStyles;
   text: string;
   className: string;
   id: string;
   placeholder?: string;
   href?: string;
}

interface DesignTokens {
   typography: {
      headings: TypographyElement[];
      paragraphs: TypographyElement[];
      buttons: TypographyElement[];
      inputs: TypographyElement[];
      links: TypographyElement[];
   };
   colors: {
      primary: string[];
      secondary: string[];
      accent: string[];
      background: string[];
      text: string[];
      border: string[];
   };
   fonts: string[];
   spacing: string[];
}

interface CSSRule {
   selector: string;
   fontFamily?: string;
   fontSize?: string;
   fontWeight?: string;
   color?: string;
   backgroundColor?: string;
}

interface Metadata {
   title: string;
   description: string;
   viewport: string;
   charset: string;
   language: string;
}

interface AnalysisSummary {
   totalElements: number;
   uniqueFonts: number;
   uniqueColors: number;
   uniqueSpacing: number;
}

interface AnalysisResult {
   metadata: Metadata;
   designTokens: DesignTokens;
   cssRules: CSSRule[];
   summary: AnalysisSummary;
}

class WebsiteAnalyzer {
   private browser: Browser | null = null;

   async initBrowser(): Promise<Browser> {
      if (!this.browser) {
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

   async closeBrowser(): Promise<void> {
      if (this.browser) {
         await this.browser.close();
         this.browser = null;
      }
   }

   async analyzeWebsite(url: string): Promise<AnalysisResult> {
      const browser = await this.initBrowser();
      const page = await browser.newPage();

      try {
         // Set viewport and user agent
         await page.setViewport({ width: 1920, height: 1080 });
         await page.setUserAgent(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
         );

         // Navigate to the website
         await page.goto(url, {
            waitUntil: "networkidle2",
            timeout: 30000,
         });

         // Wait for content to load
         await new Promise((resolve) => setTimeout(resolve, 2000));

         // Extract design tokens
         const analysis = await page.evaluate(() => {
            const getComputedStyles = (element: Element): ComputedStyles => {
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
               };
            };

            const getAllElements = (): DesignTokens => {
               const elements = document.querySelectorAll("*");
               const designTokens: DesignTokens = {
                  typography: {
                     headings: [],
                     paragraphs: [],
                     buttons: [],
                     inputs: [],
                     links: [],
                  },
                  colors: {
                     primary: [],
                     secondary: [],
                     accent: [],
                     background: [],
                     text: [],
                     border: [],
                  },
                  fonts: [],
                  spacing: [],
               };

               const fontsSet = new Set<string>();
               const spacingSet = new Set<string>();

               elements.forEach((element) => {
                  const styles = getComputedStyles(element);
                  console.log({ styles });

                  const tagName = element.tagName.toLowerCase();
                  const className = element.className || "";
                  const id = element.id || "";

                  // Collect fonts
                  if (styles.fontFamily && styles.fontFamily !== "initial") {
                     fontsSet.add(styles.fontFamily);
                  }

                  // Collect spacing
                  if (styles.padding && styles.padding !== "initial") {
                     spacingSet.add(styles.padding);
                  }
                  if (styles.margin && styles.margin !== "initial") {
                     spacingSet.add(styles.margin);
                  }

                  // Categorize elements by type
                  if (["h1", "h2", "h3", "h4", "h5", "h6"].includes(tagName)) {
                     designTokens.typography.headings.push({
                        tag: tagName,
                        styles: styles,
                        text: element.textContent?.substring(0, 100) || "",
                        className,
                        id,
                     });
                  } else if (tagName === "p") {
                     designTokens.typography.paragraphs.push({
                        styles: styles,
                        text: element.textContent?.substring(0, 100) || "",
                        className,
                        id,
                     });
                  } else if (
                     tagName === "button" ||
                     className.includes("btn") ||
                     id.includes("btn")
                  ) {
                     designTokens.typography.buttons.push({
                        styles: styles,
                        text: element.textContent?.substring(0, 100) || "",
                        className,
                        id,
                     });
                  } else if (
                     ["input", "textarea", "select"].includes(tagName)
                  ) {
                     const inputElement = element as HTMLInputElement;
                     designTokens.typography.inputs.push({
                        tag: tagName,
                        styles: styles,
                        text: element.textContent?.substring(0, 100) || "",
                        placeholder: inputElement.placeholder || "",
                        className,
                        id,
                     });
                  } else if (tagName === "a") {
                     const linkElement = element as HTMLAnchorElement;
                     designTokens.typography.links.push({
                        styles: styles,
                        text: element.textContent?.substring(0, 100) || "",
                        href: linkElement.href || "",
                        className,
                        id,
                     });
                  }

                  // Collect colors
                  if (
                     styles.color &&
                     styles.color !== "initial" &&
                     styles.color !== "rgba(0, 0, 0, 0)"
                  ) {
                     designTokens.colors.text.push(styles.color);
                  }
                  if (
                     styles.backgroundColor &&
                     styles.backgroundColor !== "initial" &&
                     styles.backgroundColor !== "rgba(0, 0, 0, 0)"
                  ) {
                     designTokens.colors.background.push(
                        styles.backgroundColor
                     );
                  }
                  if (
                     styles.borderColor &&
                     styles.borderColor !== "initial" &&
                     styles.borderColor !== "rgba(0, 0, 0, 0)"
                  ) {
                     designTokens.colors.border.push(styles.borderColor);
                  }
               });

               // Convert Sets to Arrays
               designTokens.fonts = Array.from(fontsSet);
               designTokens.spacing = Array.from(spacingSet);

               // Remove duplicates from color arrays
               designTokens.colors.text = [
                  ...new Set(designTokens.colors.text),
               ];
               designTokens.colors.background = [
                  ...new Set(designTokens.colors.background),
               ];
               designTokens.colors.border = [
                  ...new Set(designTokens.colors.border),
               ];

               return designTokens;
            };

            return getAllElements();
         });

         fs.writeFileSync("analysis.json", JSON.stringify(analysis, null, 2));

         // Extract CSS rules from stylesheets
         const cssRules = await page.evaluate(() => {
            const rules: CSSRule[] = [];
            for (let i = 0; i < document.styleSheets.length; i++) {
               try {
                  const sheet = document.styleSheets[i];
                  if (sheet && sheet.cssRules) {
                     for (let j = 0; j < sheet.cssRules.length; j++) {
                        const rule = sheet.cssRules[j] as CSSStyleRule;
                        if (rule.style) {
                           const ruleData: CSSRule = {
                              selector: rule.selectorText || "unknown",
                           };

                           if (rule.style.fontFamily) {
                              ruleData.fontFamily = rule.style.fontFamily;
                           }
                           if (rule.style.fontSize) {
                              ruleData.fontSize = rule.style.fontSize;
                           }
                           if (rule.style.fontWeight) {
                              ruleData.fontWeight = rule.style.fontWeight;
                           }
                           if (rule.style.color) {
                              ruleData.color = rule.style.color;
                           }
                           if (rule.style.backgroundColor) {
                              ruleData.backgroundColor =
                                 rule.style.backgroundColor;
                           }

                           rules.push(ruleData);
                        }
                     }
                  }
               } catch (e) {
                  // Skip cross-origin stylesheets
               }
            }
            return rules;
         });

         // console.log({
         //    cssRules,
         // });

         // Get page metadata
         const metadata = await page.evaluate(() => {
            return {
               title: document.title,
               description:
                  document
                     .querySelector('meta[name="description"]')
                     ?.getAttribute("content") || "",
               viewport:
                  document
                     .querySelector('meta[name="viewport"]')
                     ?.getAttribute("content") || "",
               charset: document.characterSet,
               language: document.documentElement.lang || "en",
            };
         });

         // console.log({
         //    metadata,
         // });

         return {
            metadata,
            designTokens: analysis,
            cssRules: cssRules.slice(0, 100), // Limit to first 100 rules
            summary: {
               totalElements:
                  analysis.typography.headings.length +
                  analysis.typography.paragraphs.length +
                  analysis.typography.buttons.length +
                  analysis.typography.inputs.length +
                  analysis.typography.links.length,
               uniqueFonts: analysis.fonts.length,
               uniqueColors:
                  analysis.colors.text.length +
                  analysis.colors.background.length +
                  analysis.colors.border.length,
               uniqueSpacing: analysis.spacing.length,
            },
         };
      } catch (error) {
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

// Export singleton instance
const analyzer = new WebsiteAnalyzer();

// Graceful shutdown
process.on("SIGINT", async () => {
   console.log("\n🔄 Shutting down gracefully...");
   await analyzer.closeBrowser();
   process.exit(0);
});

process.on("SIGTERM", async () => {
   console.log("\n🔄 Shutting down gracefully...");
   await analyzer.closeBrowser();
   process.exit(0);
});

export const analyzeWebsite = (url: string): Promise<AnalysisResult> =>
   analyzer.analyzeWebsite(url);
