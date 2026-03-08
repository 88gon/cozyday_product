
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

// 1. 만세력 라이브러리에서 사주 정보를 가져오는 로직 포함
function calculateSaju() {
    const name = document.getElementById('userName').value;
    if(!name) {
        alert("이름을 입력해주세요!");
        return;
    }

    // 1. 만세력 라이브러리를 통해 사용자의 4기둥(8글자)을 가져옵니다.
    const year = parseInt(document.getElementById('birthYear').value);
    const month = parseInt(document.getElementById('birthMonth').value);
    const day = parseInt(document.getElementById('birthDay').value);
    const hour = parseInt(document.getElementById('birthHour').value);
    const minute = parseInt(document.getElementById('birthMinute').value);

    const solar = Solar.fromYmdHms(year, month, day, hour, minute, 0);
    const lunar = solar.getLunar();
    const saju = lunar.getEightChar();
    
    const yearPillar = saju.getYear().toString();  // 년주
    const monthPillar = saju.getMonth().toString(); // 월주
    const dayPillar = saju.getDay().toString();   // 일주
    const hourPillar = saju.getHour().toString();  // 시주

    // 결과창 초기 노출
    document.getElementById('result').style.display = 'block';
    document.getElementById('resultTitle').innerText = `${name}님의 사주 결과`;

    // 2. 화면에 시주/일주/월주/년주 표 그리기 (HTML에 id="sajuTable" 인 div가 있어야 합니다)
    const tableHtml = `
      <div style="background-color: #f0f4f8; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
        <h3 style="margin-top: 0;">나의 사주 팔자</h3>
        <table style="width: 100%; text-align: center; font-size: 1.2em; border-collapse: collapse;">
          <tr style="border-bottom: 1px solid #ccc;">
            <th>시주(時)</th>
            <th>일주(日)</th>
            <th>월주(月)</th>
            <th>년주(年)</th>
          </tr>
          <tr style="font-weight: bold; padding-top: 10px;">
            <td>${hourPillar}</td>
            <td><span style="color: #e74c3c;">${dayPillar}</span></td> <td>${monthPillar}</td>
            <td>${yearPillar}</td>
          </tr>
        </table>
      </div>
    `;
    
    // 사주 표를 화면에 삽입
    document.getElementById("sajuTable").innerHTML = tableHtml;

    // 3. 일주(dayPillar)를 기준으로 DB에서 결과 찾기
    const resultData = sajuDatabase[dayPillar];

    // 결과 출력 영역 초기화 및 로딩 표시
    const resultArea = document.getElementById('resultArea');
    const loadingArea = document.getElementById('loadingArea');
    resultArea.innerHTML = '';
    loadingArea.style.display = 'block';

    // 1.5초 후 결과 표시 (호랑이 애니메이션 감상 시간)
    setTimeout(() => {
        loadingArea.style.display = 'none';

        // 4. DB 결과 화면에 뿌려주기
        if (resultData) {
            const resultHtml = `
              <h3>${resultData.title}</h3>
              <p style="color: #666; font-size: 0.9em;">${resultData.tags.join(' ')}</p>
              <hr>
              <p><strong>내 사주의 핵심 요약:</strong></p>
              <p>${resultData.description}</p>
              <p><strong>상세 분석:</strong></p>
              <p>${resultData.detail.replace(/\n/g, '<br>')}</p>
              <div style="background-color: #f9f9f9; padding: 15px; margin-top: 20px; border-radius: 8px;">
                <p><strong>💡 인생 개운법:</strong></p>
                <p>${resultData.advice}</p>
              </div>
            `;
            resultArea.innerHTML = resultHtml;
        } else {
            resultArea.innerHTML = `
              <p>아직 <b>${dayPillar}</b>에 대한 정밀 분석 데이터가 준비되지 않았습니다. 업데이트를 기다려주세요!</p>
            `;
        }
    }, 1500);
}
