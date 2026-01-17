import { GoogleGenerativeAI } from "@google/generative-ai";

// 🔴 IMPORTANT: Paste your real API Key inside these quotes before running!
const apiKey = "AIzaSyAPdrBMFKTxzlSQMHecXRdTVmnju2Xq2go"; 

const genAI = new GoogleGenerativeAI(apiKey);

async function runTest() {
  console.log("--- DIAGNOSTIC TEST ---");
  console.log("Testing Model: gemini-2.0-flash-exp");
  
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

  try {
    console.log("Attempting to generate an image...");
    // We intentionally ask for a JPEG to see if the server blocks it
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: "Draw a simple red square" }] }],
      generationConfig: { responseMimeType: "image/jpeg" }
    });
    
    console.log("✅ SUCCESS! Your key supports Image Generation.");
  } catch (error) {
    console.log("\n❌ RESTRICTION CONFIRMED:");
    console.log("Server Error:", error.message); 
    console.log("---------------------------------------------------");
    console.log("This proves your API Key is currently blocked from creating images.");
  }
}

runTest();