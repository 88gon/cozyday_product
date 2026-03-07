const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { GoogleGenerativeAI } = require("@google/generative-ai");

admin.initializeApp();

// Gemini API 설정 (환경 변수 또는 직접 입력)
// 실제 운영 환경에서는 firebase functions:config:set gemini.key="YOUR_KEY" 추천
const GENAI_API_KEY = process.env.GEMINI_API_KEY || "YOUR_ACTUAL_API_KEY_HERE";
const genAI = new GoogleGenerativeAI(GENAI_API_KEY);

exports.api = functions.https.onRequest(async (req, res) => {
  // CORS 처리
  res.set("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Methods", "GET, POST");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.set("Access-Control-Max-Age", "3600");
    res.status(204).send("");
    return;
  }

  if (req.path === "/fortune" && req.method === "POST") {
    try {
      const { name, yearPillar, monthPillar, dayPillar, timePillar, system_instruction } = req.body;

      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      const prompt = `
        ${system_instruction}
        
        사용자 데이터:
        - 이름: ${name}
        - 년주: ${yearPillar}
        - 월주: ${monthPillar}
        - 일주: ${dayPillar}
        - 시주: ${timePillar}
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      res.status(200).json({ fortune: text });
    } catch (error) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: "운세 분석 중 오류가 발생했습니다." });
    }
  } else {
    res.status(404).send("Not Found");
  }
});
