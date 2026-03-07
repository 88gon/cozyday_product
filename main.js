
// Firebase 초기화
const firebaseConfig = {
    projectId: "cozyday-product",
};
firebase.initializeApp(firebaseConfig);
const functions = firebase.functions();

// 페이지 로드 시 셀렉트 박스 옵션 생성
window.onload = function() {
    const yearSelect = document.getElementById('birthYear');
    const monthSelect = document.getElementById('birthMonth');
    const daySelect = document.getElementById('birthDay');
    const hourSelect = document.getElementById('birthHour');
    const minuteSelect = document.getElementById('birthMinute');

    // 연도: 1930 ~ 현재
    const currentYear = new Date().getFullYear();
    for (let i = currentYear; i >= 1930; i--) {
        yearSelect.add(new Option(i + '년', i));
    }
    // 월: 1 ~ 12
    for (let i = 1; i <= 12; i++) {
        monthSelect.add(new Option(i + '월', i));
    }
    // 일: 1 ~ 31
    for (let i = 1; i <= 31; i++) {
        daySelect.add(new Option(i + '일', i));
    }
    // 시: 0 ~ 23
    for (let i = 0; i <= 23; i++) {
        hourSelect.add(new Option(i + '시', i));
    }
    // 분: 0 ~ 59
    for (let i = 0; i <= 59; i++) {
        minuteSelect.add(new Option(i + '분', i));
    }

    // 기본값 설정 (예: 1990년 1월 1일)
    yearSelect.value = 1990;
};

async function getGeminiFortune(sajuData) {
    try {
        const analyzeSaju = functions.httpsCallable('analyzeSaju');
        const result = await analyzeSaju({
            userGender: sajuData.userGender,
            saju8Chars: sajuData.saju8Chars,
            currentDaewun: sajuData.currentDaewun,
            currentSewun: sajuData.currentSewun
        });
        
        return result.data.analysisResult;

    } catch (error) {
        console.error('Gemini 운세 분석 중 오류 발생:', error);
        return "운세 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요. (" + error.message + ")";
    }
}

async function calculateSaju() {
    const name = document.getElementById('userName').value;
    const year = parseInt(document.getElementById('birthYear').value);
    const month = parseInt(document.getElementById('birthMonth').value);
    const day = parseInt(document.getElementById('birthDay').value);
    const hour = parseInt(document.getElementById('birthHour').value);
    const minute = parseInt(document.getElementById('birthMinute').value);
    const gender = parseInt(document.getElementById('userGender').value);
    
    if(!name) {
        alert("이름을 입력해주세요!");
        return;
    }

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

    // 대운 계산
    const daewuns = saju.getDaewun(gender);
    const currentYear = new Date().getFullYear();
    let currentDaewunName = "알 수 없음";
    
    // 현재 대운 찾기
    const daewunList = daewuns.getDaewun();
    for (let i = 0; i < daewunList.length; i++) {
        if (currentYear >= daewunList[i].getStartYear() && currentYear <= daewunList[i].getEndYear()) {
            currentDaewunName = daewunList[i].getName();
            break;
        }
    }

    // 세운 계산 (올해)
    const currentSewunName = Solar.fromDate(new Date()).getLunar().getEightChar().getYear();

    // 사주 데이터 객체 생성
    const sajuData = {
        userGender: gender === 1 ? "남성" : "여성",
        saju8Chars: `${yearPillar} ${monthPillar} ${dayPillar} ${timePillar}`,
        currentDaewun: currentDaewunName,
        currentSewun: currentSewunName
    };

    // Gemini 운세 분석 요청
    const geminiFortune = await getGeminiFortune(sajuData);
    geminiInterpretationElem.innerText = geminiFortune;
}
