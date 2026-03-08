
// 페이지 로드 시 초기 설정
window.onload = function() {
  // 기본 설정 (필요 시 추가)
};

// 사주 계산 및 결과 출력 메인 함수
function calculateSaju() {
  const name = document.getElementById('userName').value;
  if(!name) {
      alert("이름을 입력해주세요!");
      return;
  }

  // 사용자가 입력한 날짜 및 시간 가져오기 (YYYY-MM-DD, HH:mm)
  const birthDateValue = document.getElementById('birthDate').value;
  const birthTimeValue = document.getElementById('birthTime').value;
  const gender = document.getElementById('userGender').value;

  if(!birthDateValue || !birthTimeValue) {
      alert("생년월일과 시간을 정확히 선택해주세요!");
      return;
  }

  const [year, month, day] = birthDateValue.split('-').map(Number);
  const [hour, minute] = birthTimeValue.split(':').map(Number);

  // 만세력 변환
  const solar = Solar.fromYmdHms(year, month, day, hour, minute, 0);
  const lunar = solar.getLunar();
  const saju = lunar.getEightChar();
  
  const yearPillar = saju.getYear().toString();
  const monthPillar = saju.getMonth().toString();
  const dayPillar = saju.getDay().toString();
  const hourPillar = saju.getTime().toString();

  // 결과창 초기 노출
  document.getElementById('result').style.display = 'block';
  document.getElementById('resultTitle').innerText = `${name}님의 사주 결과`;

  // 화면에 8글자 표 그리기
  const tableHtml = `
    <div style="background-color: #f0f4f8; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
      <h3 style="margin-top: 0;">나의 사주 팔자</h3>
      <table style="width: 100%; text-align: center; font-size: 1.2em; border-collapse: collapse;">
        <tr style="border-bottom: 1px solid #ccc;">
          <th>시주(時)</th><th>일주(日)</th><th>월주(月)</th><th>년주(年)</th>
        </tr>
        <tr style="font-weight: bold; padding-top: 10px;">
          <td>${hourPillar}</td><td><span style="color: #e74c3c;">${dayPillar}</span></td><td>${monthPillar}</td><td>${yearPillar}</td>
        </tr>
      </table>
    </div>
  `;
  document.getElementById("sajuTable").innerHTML = tableHtml;

  const resultData = sajuDatabase[dayPillar];

  // MBTI 소울메이트 로직
  const dayGan = saju.getDayGan().toString();
  let soulmateData = { mbti: "ENFP", char: "🌿", desc: "당신의 성장을 응원해줄 자유로운 영혼", item: "따뜻한 차 한 잔" };

  if (["甲", "乙"].includes(dayGan)) { soulmateData = { mbti: "INFJ", char: "🌲", desc: "당신의 깊은 생각을 이해해줄 따뜻한 동반자", item: "싱그러운 숲향 향수" }; }
  else if (["丙", "丁"].includes(dayGan)) { soulmateData = { mbti: "ISFJ", char: "☀️", desc: "당신의 뜨거운 열정을 묵묵히 받아줄 쉼터", item: "포근한 무릎 담요" }; }
  else if (["戊", "己"].includes(dayGan)) { soulmateData = { mbti: "ESTP", char: "⛰️", desc: "당신의 단단한 내면을 일깨워줄 활동가", item: "에너지 넘치는 러닝화" }; }
  else if (["庚", "辛"].includes(dayGan)) { soulmateData = { mbti: "ENFJ", char: "💎", desc: "당신의 날카로움을 부드럽게 감싸줄 리더", item: "반짝이는 실버 반지" }; }
  else if (["壬", "癸"].includes(dayGan)) { soulmateData = { mbti: "INTP", char: "🌊", desc: "당신의 넓은 지혜를 함께 나눌 지적인 파트너", item: "노이즈 캔슬링 이어폰" }; }

  const resultArea = document.getElementById('resultArea');
  const loadingArea = document.getElementById('loadingArea');
  resultArea.innerHTML = '';
  loadingArea.style.display = 'block';
  
  const loadingMsg = document.querySelector('.loading-msg');
  if (loadingMsg) loadingMsg.innerText = "과거의 묵은 감정은 싹 다 태워버려. 내가 불침번 설 테니까 넌 새 출발이나 준비해.";

  setTimeout(() => {
      loadingArea.style.display = 'none';
      if (resultData) {
          const tigerComment = "오, 꽤 괜찮은 기운을 타고났는데? ...물론 내가 옆에서 지켜줘서 더 잘 풀리는 거겠지만.";
          let sectionsHtml = '';
          resultData.sections.forEach((section) => {
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

          resultArea.innerHTML = `
            <div class="tiger-comment" style="background: #fdf5e6; padding: 15px; border-radius: 10px; margin-bottom: 20px; border-left: 5px solid #8d6e63; font-size: 0.95em; line-height: 1.6;">
              <strong>🐯 호랑이 수호신의 한마디:</strong><br>
              "${tigerComment}"
            </div>
            <div class="core-summary">
              <h3>${resultData.title}</h3>
              <div class="tags">${resultData.tags.join(' ')}</div>
              <p>${resultData.coreSummary}</p>
            </div>
            ${sectionsHtml}
            
            <div class="soulmate-section">
              <div class="soulmate-title">💖 49사주가 추천하는 나의 소울메이트</div>
              <span class="soulmate-character">${soulmateData.char}</span>
              <div class="soulmate-info">
                <div class="soulmate-mbti">${soulmateData.mbti} 성향</div>
                <div class="soulmate-desc">${soulmateData.desc}</div>
              </div>
              <div style="margin-top: 20px; padding: 15px; background: white; border-radius: 10px; font-size: 0.9em; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                <strong>🎁 호랑이가 던져주는 행운의 아이템:</strong><br>
                <span style="color: #e67e22; font-weight: bold; font-size: 1.1em;">[${soulmateData.item}]</span><br>
                "이거 무심하게 툭 던져두고 갈 테니까, 챙겨둬서 나쁠 거 없잖아?"
              </div>
            </div>
          `;
      } else {
          const tigerWarning = "올해는 좀 험난하겠네. 조심해서 나쁠 거 없잖아. 쫄지 마, 뒤에 내가 버티고 있으니까.";
          resultArea.innerHTML = `
            <div class="tiger-comment" style="background: #fdf5e6; padding: 15px; border-radius: 10px; margin-bottom: 20px; border-left: 5px solid #e74c3c; font-size: 0.95em; line-height: 1.6;">
              <strong>🐯 호랑이 수호신의 한마디:</strong><br>
              "${tigerWarning}"
            </div>
            <div style="text-align: center; padding: 20px;">
              <p>아직 <b>${dayPillar}</b>에 대한 정밀 분석 데이터가 준비되지 않았습니다.</p>
            </div>
          `;
      }
  }, 1500);
}

function toggleAccordion(header) {
  header.classList.toggle('active');
  const content = header.nextElementSibling;
  content.style.display = content.style.display === "block" ? "none" : "block";
}