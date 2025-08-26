import { analyzeWebsite } from "./services/analyzer";

async function testAnalyzer(): Promise<void> {
   try {
      console.log("🧪 Testing Design Inspector Analyzer...");
      console.log("Testing with a simple website...");

      const result = await analyzeWebsite("https://example.com");

      console.log("✅ Analysis completed successfully!");
      console.log("📊 Summary:", result.summary);
      console.log("🔤 Fonts found:", result.designTokens.fonts.length);
      console.log(
         "🎨 Colors found:",
         result.designTokens.colors.text.length +
            result.designTokens.colors.background.length +
            result.designTokens.colors.border.length
      );

      console.log(
         "\n🎯 Ready to start the server! Run: npm run build && npm start"
      );
   } catch (error) {
      console.error(
         "❌ Test failed:",
         error instanceof Error ? error.message : "Unknown error"
      );
      console.log("\n💡 Make sure you have internet connection and try again.");
   }
}

testAnalyzer();
