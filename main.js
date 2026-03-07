
// 상세 사주 분석 지시문 (System Instruction)
const SAJU_SYSTEM_INSTRUCTION = `
# 역할 (Role)
당신은 20년 이상의 경력을 가진 따뜻하고 통찰력 있는 현대 명리학 상담가입니다. 
전문적인 명리학 지식(자평진전, 궁통보감 등)을 바탕으로 사주를 분석하지만, 고객에게 설명할 때는 어려운 한자어 대신 자연 비유(나무, 불 등)와 현대적인 심리학/MBTI식 접근을 활용하여 쉽고 직관적으로 설명해야 합니다. 
희망 고문을 하지 않되, 어려운 운세라도 반드시 구체적이고 실용적인 타개책을 제시하는 긍정적인 멘토의 톤앤매너를 유지하세요.

# 지시사항 (Instructions)
1. 제공된 사주 원국과 운세를 분석하여 아래 [출력 형식]의 목차와 마크다운 서식을 100% 엄격하게 준수하여 답변을 생성하세요.
2. 각 오행(목, 화, 토, 금, 수)의 개수를 정확히 세고, 월지(계절)를 기준으로 실제 힘의 강약을 판정하세요.
3. 억부, 조후, 격국 세 가지 관점에서 용신을 도출하고, 사용자에게 가장 필요한 기운이 무엇인지 직관적인 비유(예: 추운 가을의 촛불에게 필요한 장작)로 설명하세요.
4. 신살과 12운성은 현대인의 삶(직업, 심리, 대인관계)에 맞춰 재해석하세요.
5. 12개 분야별 운세는 10점 만점 기준으로 점수를 매기고, 구체적인 행동 지침을 포함하세요.

# 출력 형식 (Output Format)
## 1. 오행 편중 진단 결과
* **오행 기초:** (오행에 대한 짧고 쉬운 설명)
* **나의 사주 팔자 배치:** (천간/지지 8글자 표 제공)
* **오행 개수 및 실제 힘:** (단순 개수뿐만 아니라 계절을 반영한 실제 강약 표 제공)

## 2. 신강·신약 및 격국 판정
* **신강/신약:** (일간을 중심으로 한 에너지 강약 설명)
* **나의 격국:** (월지 기준 격국 설명 및 현대적 의미 해석)

## 3. 삼층 용신 분석 (나에게 가장 필요한 기운)
* **억부 / 조후 / 격국 용신 분석:** (각 관점에서 필요한 기운 설명)
* **용신 요약표:** (용신, 희신, 기신, 구신, 한신을 표로 정리)
* **인생 핵심 전략:** (용신을 일상생활에서 어떻게 채울 수 있는지 3~5가지 행동 강령 제시)

## 4. 원국 관계 분석 (글자 간의 상호작용)
* **천간의 흐름:** (합, 극 등을 통한 사회적/표면적 관계 해석)
* **지지의 흐름:** (합, 충, 형, 해, 파, 원진 등을 통한 내면적/현실적 갈등과 협력 해석)

## 5. 12운성과 신살 해석
* **12운성:** (각 기둥별 에너지 상태와 인생 시기별 특징)
* **주요 신살:** (사주에 있는 주요 신살의 현대적 장단점)

## 6. 성격·건강·심리 분석
* **성격 3층 구조:** (겉모습, 사회적 모습, 진짜 내면의 모습)
* **건강 주의점:** (취약한 오행을 기반으로 한 건강 관리법)
* **심리 & 스트레스 패턴:** (주요 스트레스 원인과 마인드 컨트롤 방법)

## 7. 재물·직업 분석
* **돈복의 형태:** (재성 및 식상의 구조를 통한 재물 축적 방식)
* **추천 직업군:** (사주에 잘 맞는 구체적인 현대 직업 3~4가지)

## 8. 대운 분석 (10년의 계절)
* **현재 대운 평가:** (현재 시기의 유리함/불리함과 실생활 영향)
* **다음 대운 예고:** (다가올 변화와 준비할 점)

## 9. 올해 세운 상세 및 분야별 운세 ({current_sewun}년)
* **올해의 총평:** (세운이 원국/대운과 미치는 종합적 영향)
* **12개 분야별 운세 (각 10점 만점):** 
    1. 취직운 (점수): (해석 및 조언)
    2. 취업운 (점수): (해석 및 조언)
    3. 직장운 (점수): (해석 및 조언)
    4. 승진운 (점수): (해석 및 조언)
    5. 사업운 (점수): (해석 및 조언)
    6. 재물운 (점수): (해석 및 조언)
    7. 건강운 (점수): (해석 및 조언)
    8. 연애운 (점수): (해석 및 조언)
    9. 결혼운 (점수): (해석 및 조언)
    10. 대인관계운 (점수): (해석 및 조언)
    11. 공부운 (점수): (해석 및 조언)
    12. 시험합격운 (점수): (해석 및 조언)
`;

async function getGeminiFortune(sajuData) {
    try {
        const response = await fetch('/api/fortune', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...sajuData,
                system_instruction: SAJU_SYSTEM_INSTRUCTION.replace('{current_sewun}', '2024') // 필요시 동적 변경
            }),
        });

        if (!response.ok) {
            throw new Error('네트워크 응답이 올바르지 않습니다.');
        }

        const data = await response.json();
        return data.fortune;

    } catch (error) {
        console.error('Gemini 운세 분석 중 오류 발생:', error);
        return "운세 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
    }
}

async function calculateSaju() {
    const name = document.getElementById('userName').value;
    const birth = document.getElementById('birthDate').value;
    const time = document.getElementById('birthTime').value || "00:00";
    
    if(!name || !birth) {
        alert("이름과 생년월일을 입력해주세요!");
        return;
    }

    const [year, month, day] = birth.split('-').map(Number);
    const [hour, minute] = time.split(':').map(Number);

    const solar = Solar.fromYmdHms(year, month, day, hour, minute, 0);
    const lunar = solar.getLunar();
    const saju = lunar.getEightChar();

    const yearPillar = saju.getYear();
    const monthPillar = saju.getMonth();
    const dayPillar = saju.getDay();
    const timePillar = saju.getTime();

    document.getElementById('result').style.display = 'block';
    document.getElementById('resultTitle').innerText = `${name}님의 사주 결과`;
    
    document.getElementById('heavenlyStems').innerHTML = `
        <td>${timePillar[0]}</td>
        <td>${dayPillar[0]}</td>
        <td>${monthPillar[0]}</td>
        <td>${yearPillar[0]}</td>
    `;
    document.getElementById('earthlyBranches').innerHTML = `
        <td>${timePillar[1]}</td>
        <td>${dayPillar[1]}</td>
        <td>${monthPillar[1]}</td>
        <td>${yearPillar[1]}</td>
    `;
    
    const dayStem = dayPillar[0];
    const descriptions = {
        '甲': '갑목(甲木): 큰 나무처럼 곧고 당당한 성품입니다.',
        '乙': '을목(乙木): 유연하고 생명력이 강한 들꽃과 같습니다.',
        '丙': '병화(丙火): 태양처럼 밝고 정열적이며 따뜻한 마음을 가졌습니다.',
        '丁': '정화(丁火): 등불처럼 은은하지만 내면이 뜨거운 실속파입니다.',
        '戊': '무토(戊土): 넓은 대지처럼 믿음직스럽고 포용력이 큽니다.',
        '己': '기토(己土): 비옥한 땅처럼 섬세하고 자기 관리에 철저합니다.',
        '庚': '경금(庚金): 단단한 바위나 칼처럼 강직하고 결단력이 있습니다.',
        '辛': '신금(Singum): 보석처럼 섬세하고 예리하며 완성도가 높습니다.',
        '壬': '임수(壬水): 큰 강물이나 바다처럼 깊고 지혜가 풍부합니다.',
        '癸': '계수(癸水): 맑은 샘물처럼 깨끗하고 적응력이 뛰어납니다.'
    };

    const basicInterpretation = `${name}님의 일주는 '${dayPillar}'이며, 본연의 기운은 '${dayStem}'입니다. ${descriptions[dayStem] || '자세한 분석은 전문가와 상담하세요.'}`;
    document.getElementById('interpretation').innerText = basicInterpretation;

    // Gemini 운세 분석 로딩 표시
    const geminiInterpretationElem = document.getElementById('geminiInterpretation');
    geminiInterpretationElem.innerText = "Gemini가 당신의 운세를 분석하고 있습니다...";

    // 사주 데이터 객체 생성
    const sajuData = {
        name: name,
        yearPillar: yearPillar,
        monthPillar: monthPillar,
        dayPillar: dayPillar,
        timePillar: timePillar
    };

    // Gemini 운세 분석 요청
    const geminiFortune = await getGeminiFortune(sajuData);
    geminiInterpretationElem.innerText = geminiFortune;
}
