
// 페이지 로드 시 셀렉트 박스 옵션 및 초기 설정
window.onload = function() {
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

// 1. 만세력 라이브러리에서 일주(태어난 날의 두 글자) 알아내기
function getIlju() {
    const year = parseInt(document.getElementById('birthYear').value);
    const month = parseInt(document.getElementById('birthMonth').value);
    const day = parseInt(document.getElementById('birthDay').value);
    const hour = parseInt(document.getElementById('birthHour').value);
    const minute = parseInt(document.getElementById('birthMinute').value);

    const solar = Solar.fromYmdHms(year, month, day, hour, minute, 0);
    const lunar = solar.getLunar();
    const saju = lunar.getEightChar();
    
    return saju.getDay(); // 예: "壬子"
}

function calculateSaju() {
    const name = document.getElementById('userName').value;
    if(!name) {
        alert("이름을 입력해주세요!");
        return;
    }

    // 일주 가져오기
    const userIlju = getIlju(); 

    // 결과창 초기 노출 및 이전 데이터 초기화
    document.getElementById('result').style.display = 'block';
    document.getElementById('resultTitle').innerText = `${name}님의 사주 결과`;
    document.getElementById('resultArea').innerHTML = '';
    
    // 로딩 영역 표시
    const loadingArea = document.getElementById('loadingArea');
    loadingArea.style.display = 'block';

    console.log("49사주가 데이터를 분석 중입니다...");

    // 1.5초 후 결과 표시 (호랑이 애니메이션 감상 시간)
    setTimeout(() => {
        // 로딩 영역 숨기기
        loadingArea.style.display = 'none';

        // sajuData.js 데이터베이스에서 일주 찾기
        const resultData = sajuDatabase[userIlju];

        if (resultData) {
            const htmlContent = `
                <h3>${resultData.title}</h3>
                <p style="color: #666; font-size: 0.9em;">${resultData.tags.join(' ')}</p>
                <hr>
                <p><strong>내 사주의 핵심 요약:</strong></p>
                <p>${resultData.description}</p>
                <p><strong>상세 분석:</strong></p>
                <p>${resultData.detail.replace(/\n/g, '<br>')}</p>
                <div style="background-color: #f9f9f9; padding: 15px; margin-top: 20px; border-radius: 8px;">
                    <p><strong>💡 인생 개운법 (Advice):</strong></p>
                    <p>${resultData.advice}</p>
                </div>
            `;
            document.getElementById("resultArea").innerHTML = htmlContent;
        } else {
            document.getElementById("resultArea").innerHTML = `
                <p><strong>'${userIlju}'</strong> 일주의 정밀 분석 데이터를 준비 중입니다!</p>
                <p>현재 임자(壬子), 정묘(丁卯) 일주가 등록되어 있습니다.</p>
            `;
        }
    }, 1500);
}
