// services/designScraper.ts

import puppeteer, { Browser, Page } from "puppeteer";
import { ScrapedData, ElementData } from "../types/design-system.types";

class DesignScraper {
   private browser: Browser | null = null;
   private page: Page | null = null;
   private options: {
      timeout?: number;
      maxElements?: number;
      screenshot?: boolean;
      fullPage?: boolean;
   };

   constructor(options = {}) {
      this.options = {
         timeout: 30000,
         maxElements: 1000,
         screenshot: true,
         fullPage: false,
         ...options,
      };
   }

   async init(): Promise<void> {
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
      this.page = await this.browser.newPage();
      await this.page.setViewport({ width: 1920, height: 1080 });

      // Set user agent to avoid bot detection
      await this.page.setUserAgent(
         "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      );
   }

   async scrapeWebsite(url: string): Promise<ScrapedData> {
      if (!this.page) {
         throw new Error("Scraper not initialized. Call init() first.");
      }

      try {
         // Navigate to the URL
         const timeout = this.options.timeout || 30000;
         await this.page.goto(url, {
            waitUntil: "networkidle0",
            timeout: timeout,
         });

         // Wait for styles to load
         await new Promise((resolve) => setTimeout(resolve, 2000));

         // Inject extraction script
         const extractedData = await this.page.evaluate((maxElements) => {
            const data: Omit<ScrapedData, "screenshot"> = {
               url: window.location.href,
               stylesheets: [],
               inlineStyles: [],
               elements: [],
               customProperties: {},
               meta: {
                  title: document.title,
               },
            };

            // 1. Get all external stylesheets
            const styleSheets = Array.from(document.styleSheets);
            styleSheets.forEach((sheet) => {
               try {
                  const rules = Array.from(sheet.cssRules || sheet.rules || []);
                  if (sheet.href) {
                     data.stylesheets.push({
                        href: sheet.href,
                        rules: rules.map((rule) => rule.cssText),
                     });
                  }
               } catch (e) {
                  // Cross-origin stylesheets
                  if (sheet.href) {
                     data.stylesheets.push({
                        href: sheet.href,
                        crossOrigin: true,
                        rules: [],
                     });
                  }
               }
            });

            // 2. Get inline styles
            const styleElements = document.querySelectorAll("style");
            styleElements.forEach((style) => {
               if (style.textContent) {
                  data.inlineStyles.push(style.textContent);
               }
            });

            // 3. Get computed styles for all elements
            const allElements = document.querySelectorAll("*");
            const elementsToAnalyze = Array.from(allElements).slice(
               0,
               maxElements
            );

            elementsToAnalyze.forEach((element) => {
               const computed = window.getComputedStyle(element);
               const tagName = element.tagName.toLowerCase();
               const classList = Array.from(element.classList);

               // Skip invisible elements
               if (
                  computed.display === "none" ||
                  computed.visibility === "hidden"
               ) {
                  return;
               }

               const elementData: ElementData = {
                  tagName,
                  classList,
                  styles: {
                     // Typography
                     fontFamily: computed.fontFamily,
                     fontSize: computed.fontSize,
                     fontWeight: computed.fontWeight,
                     fontStyle: computed.fontStyle,
                     lineHeight: computed.lineHeight,
                     letterSpacing: computed.letterSpacing,
                     textTransform: computed.textTransform,

                     // Colors
                     color: computed.color,
                     backgroundColor: computed.backgroundColor,
                     backgroundImage: computed.backgroundImage,
                     borderColor: computed.borderColor,

                     // Spacing
                     padding: computed.padding,
                     paddingTop: computed.paddingTop,
                     paddingRight: computed.paddingRight,
                     paddingBottom: computed.paddingBottom,
                     paddingLeft: computed.paddingLeft,
                     margin: computed.margin,
                     marginTop: computed.marginTop,
                     marginRight: computed.marginRight,
                     marginBottom: computed.marginBottom,
                     marginLeft: computed.marginLeft,
                     gap: computed.gap,

                     // Layout
                     display: computed.display,
                     width: computed.width,
                     maxWidth: computed.maxWidth,

                     // Effects
                     boxShadow: computed.boxShadow,
                     borderRadius: computed.borderRadius,
                     borderWidth: computed.borderWidth,
                     transition: computed.transition,
                     transform: computed.transform,
                     opacity: computed.opacity,
                  },
                  text: element.textContent?.trim().slice(0, 100) || "",
               };

               data.elements.push(elementData);
            });

            // 4. Get CSS custom properties
            const rootStyles = window.getComputedStyle(
               document.documentElement
            );
            const customProps: Record<string, string> = {};

            for (let i = 0; i < rootStyles.length; i++) {
               const prop = rootStyles[i];
               if (prop && prop.startsWith("--")) {
                  const value = rootStyles.getPropertyValue(prop).trim();
                  if (value) {
                     customProps[prop] = value;
                  }
               }
            }

            data.customProperties = customProps;

            // 5. Get meta information
            const faviconEl =
               document.querySelector<HTMLLinkElement>('link[rel*="icon"]');
            const viewportEl = document.querySelector<HTMLMetaElement>(
               'meta[name="viewport"]'
            );

            data.meta = {
               title: document.title || "Untitled",
            };
            if (faviconEl?.href) {
               data.meta.favicon = faviconEl.href;
            }
            if (viewportEl?.content) {
               data.meta.viewport = viewportEl.content;
            }

            return data;
         }, this.options.maxElements || 1000);

         // Take screenshot if enabled
         let screenshot: string | undefined;
         if (this.options.screenshot) {
            screenshot = await this.page.screenshot({
               encoding: "base64",
               fullPage: this.options.fullPage || false,
            });
         }

         // Process external stylesheets that were cross-origin
         for (const sheet of extractedData.stylesheets) {
            if (sheet.crossOrigin && sheet.href) {
               try {
                  const response = await this.page.goto(sheet.href, {
                     waitUntil: "domcontentloaded",
                     timeout: 10000,
                  });
                  if (response) {
                     const css = await response.text();
                     sheet.rules = this.parseCSSText(css);
                     sheet.crossOrigin = false;
                  }
               } catch (e) {
                  console.log(`Could not fetch stylesheet: ${sheet.href}`);
               }
            }
         }

         // Navigate back to original page
         await this.page.goto(url, { waitUntil: "domcontentloaded" });

         const result: ScrapedData = {
            ...extractedData,
            url,
         };
         if (screenshot) {
            result.screenshot = screenshot;
         }
         return result;
      } catch (error) {
         console.error("Scraping error:", error);
         throw error;
      }
   }

   private parseCSSText(
      cssText: string
   ): { selector: string; declarations: string }[] {
      const rules: { selector: string; declarations: string }[] = [];
      const ruleRegex = /([^{]+)\{([^}]+)\}/g;
      let match: RegExpExecArray | null;

      while ((match = ruleRegex.exec(cssText)) !== null) {
         if (match[1] && match[2]) {
            rules.push({
               selector: match[1].trim(),
               declarations: match[2].trim(),
            });
         }
      }

      return rules;
   }

   async close(): Promise<void> {
      if (this.page) {
         await this.page.close();
      }
      if (this.browser) {
         await this.browser.close();
      }
   }
}

export default DesignScraper;
