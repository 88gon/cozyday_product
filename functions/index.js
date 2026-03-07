const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { GoogleGenerativeAI } = require("@google/generative-ai");

admin.initializeApp();

/**
 * Gemini API 설정
 * 우선순위: 1. Firebase 환경 변수(config) 2. 시스템 환경 변수
 */
const GENAI_API_KEY = functions.config().gemini ? functions.config().gemini.key : process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GENAI_API_KEY || "YOUR_ACTUAL_API_KEY");

exports.api = functions.https.onRequest(async (req, res) => {
  // CORS 설정
  res.set("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Methods", "POST");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.set("Access-Control-Max-Age", "3600");
    res.status(204).send("");
    return;
  }

  if (req.path === "/fortune" && req.method === "POST") {
    try {
      const { name, yearPillar, monthPillar, dayPillar, timePillar, system_instruction } = req.body;

      if (!GENAI_API_KEY || GENAI_API_KEY === "YOUR_ACTUAL_API_KEY") {
        throw new Error("Gemini API Key가 설정되지 않았습니다.");
      }

      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      // 최종 프롬프트 구성
      const prompt = `
${system_instruction}

[분석 대상 데이터]
- 이름: ${name}
- 사주 원국: ${yearPillar} (년), ${monthPillar} (월), ${dayPillar} (일), ${timePillar} (시)

위 데이터를 바탕으로 당신의 따뜻한 통찰력을 담아 분석 리포트를 작성해 주세요.
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      res.status(200).json({ fortune: text });
    } catch (error) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ 
        error: "운세 분석 중 오류가 발생했습니다.",
        message: error.message 
      });
    }
  } else {
    res.status(404).send("Not Found");
  }
});
