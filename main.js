
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

// 사주 계산 및 결과 출력 메인 함수
function calculateSaju() {
  const name = document.getElementById('userName').value;
  if(!name) {
      alert("이름을 입력해주세요!");
      return;
  }

  // 사용자가 입력한 생년월일시 가져오기
  const year = parseInt(document.getElementById('birthYear').value);
  const month = parseInt(document.getElementById('birthMonth').value);
  const day = parseInt(document.getElementById('birthDay').value);
  const hour = parseInt(document.getElementById('birthHour').value);
  const minute = parseInt(document.getElementById('birthMinute').value);

  // 만세력 변환
  const solar = Solar.fromYmdHms(year, month, day, hour, minute, 0);
  const lunar = solar.getLunar();
  const saju = lunar.getEightChar();
  
  // 💡 버그 수정 완료! getHour() -> getTime()
  const yearPillar = saju.getYear().toString();  // 년주
  const monthPillar = saju.getMonth().toString(); // 월주
  const dayPillar = saju.getDay().toString();   // 일주 (예: 壬子)
  const hourPillar = saju.getTime().toString();  // 시주

  // 결과창 보여주기 시작
  document.getElementById('result').style.display = 'block';
  document.getElementById('resultTitle').innerText = `${name}님의 사주 결과`;

  // 화면에 8글자 표 그리기
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
          <td><span style="color: #e74c3c;">${dayPillar}</span></td> 
          <td>${monthPillar}</td>
          <td>${yearPillar}</td>
        </tr>
      </table>
    </div>
  `;
  document.getElementById("sajuTable").innerHTML = tableHtml;

  // 일주(dayPillar)를 기준으로 DB에서 결과 찾기
  const resultData = sajuDatabase[dayPillar];

  // 결과 출력 영역 준비 및 로딩 애니메이션 켜기
  const resultArea = document.getElementById('resultArea');
  const loadingArea = document.getElementById('loadingArea');
  resultArea.innerHTML = '';
  loadingArea.style.display = 'block';

  // 1.5초 후 호랑이 퇴장 & 해설 등장
  setTimeout(() => {
      loadingArea.style.display = 'none';

      if (resultData) {
          // DB에 데이터가 있을 경우 (새로운 아코디언 구조)
          let sectionsHtml = '';
          resultData.sections.forEach((section, index) => {
            sectionsHtml += `
              <div class="accordion-item">
                <div class="accordion-header" onclick="toggleAccordion(this)">
                  ${section.title}
                </div>
                <div class="accordion-content">
                  ${section.content.replace(/\n/g, '<br>')}
                </div>
              </div>
            `;
          });

          const resultHtml = `
            <div class="core-summary">
              <h3>${resultData.title}</h3>
              <div class="tags">${resultData.tags.join(' ')}</div>
              <p>${resultData.coreSummary}</p>
            </div>
            ${sectionsHtml}
          `;
          resultArea.innerHTML = resultHtml;
      } else {
          // DB에 데이터가 없을 경우 (나머지 58개 일주)
          resultArea.innerHTML = `
            <div style="text-align: center; padding: 20px;">
              <p>아직 <b>${dayPillar}</b>에 대한 정밀 분석 데이터가 준비되지 않았습니다.</p>
              <p>조만간 더 소름 돋는 분석으로 업데이트될 예정입니다!</p>
            </div>
          `;
      }
  }, 1500);
}

// 아코디언 토글 함수
function toggleAccordion(header) {
  header.classList.toggle('active');
  const content = header.nextElementSibling;
  if (content.style.display === "block") {
    content.style.display = "none";
  } else {
    content.style.display = "block";
  }
}