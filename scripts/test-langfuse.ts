/**
 * Test script to verify Langfuse configuration
 * Run with: npx tsx scripts/test-langfuse.ts
 */

import { getLangfuseClient } from "../src/lib/langfuse/client";

async function testLangfuseConnection() {
  console.log("🔍 Testing Langfuse connection...\n");

  // Check environment variables
  console.log("📋 Environment Variables:");
  console.log("  LANGFUSE_PUBLIC_KEY:", process.env.LANGFUSE_PUBLIC_KEY ? "✅ Set" : "❌ Missing");
  console.log("  LANGFUSE_SECRET_KEY:", process.env.LANGFUSE_SECRET_KEY ? "✅ Set" : "❌ Missing");
  console.log("  LANGFUSE_BASE_URL:", process.env.LANGFUSE_BASE_URL || "https://cloud.langfuse.com (default)");
  console.log();

  if (!process.env.LANGFUSE_PUBLIC_KEY || !process.env.LANGFUSE_SECRET_KEY) {
    console.error("❌ Missing Langfuse API keys!");
    console.log("\n📝 To fix this:");
    console.log("1. Sign up at https://cloud.langfuse.com");
    console.log("2. Create a new project");
    console.log("3. Copy your Public Key and Secret Key");
    console.log("4. Add them to your .env.local file:");
    console.log("   LANGFUSE_SECRET_KEY=sk-lf-...");
    console.log("   LANGFUSE_PUBLIC_KEY=pk-lf-...");
    process.exit(1);
  }

  try {
    const langfuse = getLangfuseClient();
    
    console.log("✅ Langfuse client initialized successfully!");
    console.log("\n🧪 Creating a test trace...");

    // Create a test trace
    const trace = langfuse.trace({
      name: "test-trace",
      metadata: {
        test: true,
        environment: "development",
        project: "Salesmatter",
      },
      tags: ["test"],
    });

    console.log("✅ Test trace created:", trace.id);

    // Flush to send the trace
    await langfuse.flushAsync();
    console.log("✅ Trace sent to Langfuse!");

    console.log("\n🎉 Success! Your Langfuse integration is working!");
    console.log("📊 View your traces at:", process.env.LANGFUSE_BASE_URL);
    console.log("\n💡 Next steps:");
    console.log("  1. Start your dev server: pnpm dev");
    console.log("  2. Generate some emails or run lead research");
    console.log("  3. View traces in your Langfuse dashboard");

  } catch (error) {
    console.error("\n❌ Error testing Langfuse connection:");
    if (error instanceof Error) {
      console.error("  Message:", error.message);
      
      if (error.message.includes("401") || error.message.includes("Unauthorized")) {
        console.log("\n🔑 Your API keys appear to be invalid.");
        console.log("  1. Double-check your keys in .env.local");
        console.log("  2. Make sure you're using keys from the correct Langfuse region");
        console.log("     - EU: https://cloud.langfuse.com");
        console.log("     - US: https://us.cloud.langfuse.com");
      } else if (error.message.includes("ENOTFOUND") || error.message.includes("network")) {
        console.log("\n🌐 Network error - check your internet connection and LANGFUSE_BASE_URL");
      }
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

testLangfuseConnection();


