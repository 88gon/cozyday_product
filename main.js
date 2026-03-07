
// Firebase 초기화 (Modular SDK 방식)
const firebaseConfig = {
    projectId: "cozyday-product",
};

let app, functions, analyzeSaju;

// 페이지 로드 시 셀렉트 박스 옵션 및 Firebase 초기화
window.onload = function() {
    const { initializeApp, getFunctions, httpsCallable } = window.firebaseModules;
    app = initializeApp(firebaseConfig);
    functions = getFunctions(app);
    analyzeSaju = httpsCallable(functions, 'analyzeSaju');

    const yearSelect = document.getElementById('birthYear');
    const monthSelect = document.getElementById('birthMonth');
    const daySelect = document.getElementById('birthDay');
    const hourSelect = document.getElementById('birthHour');
    const minuteSelect = document.getElementById('birthMinute');

    if (!yearSelect) return;

    const currentYear = new Date().getFullYear();
    for (let i = currentYear; i >= 1930; i--) {
        yearSelect.add(new Option(i + '년', i));
    }
    for (let i = 1; i <= 12; i++) {
        monthSelect.add(new Option(i + '월', i));
    }
    for (let i = 1; i <= 31; i++) {
        daySelect.add(new Option(i + '일', i));
    }
    for (let i = 0; i <= 23; i++) {
        hourSelect.add(new Option(i + '시', i));
    }
    for (let i = 0; i <= 59; i++) {
        minuteSelect.add(new Option(i + '분', i));
    }
    yearSelect.value = 1990;
};

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

    // UI 요소 초기화
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const loadingText = document.getElementById('loadingText');
    const geminiInterpretationElem = document.getElementById('geminiInterpretation');

    progressContainer.style.display = 'block';
    loadingText.style.display = 'block';
    geminiInterpretationElem.style.display = 'none';
    progressBar.style.width = '0%';
    progressBar.innerText = '0%';

    // 1. 만세력 라이브러리에서 천간/지지 8글자 추출
    const saju8Chars = `${yearPillar} ${monthPillar} ${dayPillar} ${timePillar}`;

    // 2. 테스트용 고정값 사용
    const currentDaewun = "현재 대운 파악 중"; 
    const currentSewun = "2026년 丙午년";

    // 3. 성별 데이터
    const userGender = gender === 1 ? "건명 (남성)" : "곤명 (여성)";

    // 프로그레스 바 애니메이션
    let progress = 0;
    const progressInterval = setInterval(() => {
        if (progress < 90) {
            progress += Math.random() * 10;
            if (progress > 90) progress = 90;
            progressBar.style.width = progress + '%';
            progressBar.innerText = Math.floor(progress) + '%';
        }
    }, 300);

    try {
        console.log("제미나이에게 사주 분석을 요청합니다...");
        
        // Firebase 함수 호출 (analyzeSaju 사용)
        const result = await analyzeSaju({
            userGender: userGender,
            saju8Chars: saju8Chars,
            currentDaewun: currentDaewun,
            currentSewun: currentSewun
        });

        const finalText = result.data.analysisResult;
        console.log("분석 완료!", finalText);

        clearInterval(progressInterval);
        progressBar.style.width = '100%';
        progressBar.innerText = '100%';

        setTimeout(() => {
            progressContainer.style.display = 'none';
            loadingText.style.display = 'none';
            geminiInterpretationElem.innerHTML = marked.parse(finalText);
            geminiInterpretationElem.style.display = 'block';
        }, 500);

    } catch (error) {
        console.error("제미나이 연결 중 에러 발생:", error);
        clearInterval(progressInterval);
        progressContainer.style.display = 'none';
        loadingText.style.display = 'none';
        geminiInterpretationElem.innerText = "분석 중 서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요. (" + error.message + ")";
        geminiInterpretationElem.style.display = 'block';
    }
}
