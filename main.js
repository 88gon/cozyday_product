
async function getGeminiFortune(sajuData) {
    try {
        // 백엔드에 사주 데이터를 보내고 Gemini 분석 결과를 받아옵니다.
        const response = await fetch('/api/fortune', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(sajuData),
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
