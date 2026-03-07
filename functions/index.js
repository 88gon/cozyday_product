const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// 1. 제미나이 초기화 (방금 만든 .env 파일에서 API 키를 자동으로 불러옵니다)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 2. 프론트엔드에서 호출할 함수 이름: analyzeSaju
exports.analyzeSaju = onCall(async (request) => {
  try {
    // 3. 웹사이트(프론트엔드)에서 사용자가 보낸 사주 데이터 받기
    const { userGender, saju8Chars, currentDaewun, currentSewun } = request.data;

    // 만약 데이터가 안 넘어왔다면 에러 처리
    if (!saju8Chars) {
      throw new HttpsError("invalid-argument", "사주 8글자 정보가 필요합니다.");
    }

    // 4. 제미나이 모델 세팅 및 시스템 프롬프트(지시문) 입력
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash", // 빠르고 가성비 좋은 모델
      systemInstruction: `당신은 20년 이상의 경력을 가진 따뜻하고 통찰력 있는 현대 명리학 상담가입니다. 
      입력받은 사주 원국과 대운/세운을 바탕으로, 오행 편중, 신강/신약, 용신, 원국 관계, 
      건강/심리, 재물/직업, 올해의 12개 분야별 운세를 상세하게 마크다운 형식으로 분석해 주세요.`,
    });

    // 5. 제미나이에게 분석 시작 명령
    const prompt = `
      - 사용자 성별: ${userGender}
      - 사주 원국: ${saju8Chars}
      - 현재 대운: ${currentDaewun}
      - 올해 세운: ${currentSewun}
      이 정보를 바탕으로 사주를 정밀하게 분석해줘.
    `;
    
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // 6. 분석 완료된 텍스트를 다시 웹사이트(프론트엔드)로 던져주기
    return { analysisResult: responseText };

  } catch (error) {
    console.error("제미나이 API 호출 중 에러 발생:", error);
    throw new HttpsError("internal", "사주 분석 중 서버 오류가 발생했습니다.");
  }
});
