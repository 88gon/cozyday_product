
// 페이지 로드 시 초기화
function init() {
  try {
    initSelects();
  } catch (e) {
    console.error("Initialization failed:", e);
  }
}

// DOM이 이미 로드되었는지 확인 후 실행
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

function initSelects() {
  const yearSelect = document.getElementById('birthYear');
  const monthSelect = document.getElementById('birthMonth');
  const daySelect = document.getElementById('birthDay');
  const hourSelect = document.getElementById('birthHour');
  const minuteSelect = document.getElementById('birthMinute');

  if (!yearSelect || !monthSelect || !daySelect || !hourSelect || !minuteSelect) {
    console.error("One or more select elements not found");
    return;
  }

  // 기존 내용 초기화
  yearSelect.innerHTML = '';
  monthSelect.innerHTML = '';
  daySelect.innerHTML = '';
  hourSelect.innerHTML = '';
  minuteSelect.innerHTML = '';

  // 년 (1930 - 현재)
  const currentYear = new Date().getFullYear();
  for (let i = currentYear; i >= 1930; i--) {
    const opt = document.createElement('option');
    opt.value = i;
    opt.innerText = i + "년";
    if (i === 1990) opt.selected = true;
    yearSelect.appendChild(opt);
  }

  // 월 (1 - 12)
  for (let i = 1; i <= 12; i++) {
    const opt = document.createElement('option');
    opt.value = i;
    opt.innerText = i + "월";
    monthSelect.appendChild(opt);
  }

  // 일 (1 - 31)
  for (let i = 1; i <= 31; i++) {
    const opt = document.createElement('option');
    opt.value = i;
    opt.innerText = i + "일";
    daySelect.appendChild(opt);
  }

  // 시 (0 - 23)
  for (let i = 0; i <= 23; i++) {
    const opt = document.createElement('option');
    opt.value = i;
    let ampm = i < 12 ? "오전" : "오후";
    let displayHour = i % 12;
    if (displayHour === 0) displayHour = 12;
    opt.innerText = ampm + " " + displayHour + "시";
    if (i === 12) opt.selected = true;
    hourSelect.appendChild(opt);
  }

  // 분 (0 - 59)
  for (let i = 0; i <= 59; i++) {
    const opt = document.createElement('option');
    opt.value = i;
    opt.innerText = i + "분";
    minuteSelect.appendChild(opt);
  }
}

// 사주 계산 및 결과 출력 메인 함수
function calculateSaju() {
  const name = document.getElementById('userName').value;
  if(!name) {
      alert("이름을 입력해주세요!");
      return;
  }

  const yearVal = document.getElementById('birthYear').value;
  const monthVal = document.getElementById('birthMonth').value;
  const dayVal = document.getElementById('birthDay').value;
  const hourVal = document.getElementById('birthHour').value;
  const minuteVal = document.getElementById('birthMinute').value;
  const genderVal = document.getElementById('gender').value;

  if(!yearVal || !monthVal || !dayVal) {
      alert("생년월일을 정확히 선택해주세요!");
      return;
  }

  const year = parseInt(yearVal);
  const month = parseInt(monthVal);
  const day = parseInt(dayVal);
  const hour = parseInt(hourVal);
  const minute = parseInt(minuteVal);
  const gender = parseInt(genderVal);

  // Solar 객체 확인 (lunar-javascript 라이브러리)
  if (typeof Solar === 'undefined') {
    alert("라이브러리 로딩 중입니다. 잠시 후 다시 시도해주세요.");
    return;
  }

  // 만세력 변환
  const solar = Solar.fromYmdHms(year, month, day, hour, minute, 0);
  const lunar = solar.getLunar();
  const saju = lunar.getEightChar();
  
  const yearPillar = saju.getYear().toString();
  const monthPillar = saju.getMonth().toString();
  const dayPillar = saju.getDay().toString();
  const hourPillar = saju.getTime().toString();

  document.getElementById('result').style.display = 'block';
  document.getElementById('resultTitle').innerText = `${name}님의 사주 결과`;

  const tableHtml = `
    <div style="background-color: #fffbf5; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 20px; border: 1px solid #ffedda;">
      <h3 style="margin-top: 0; color: #e67e22;">나의 사주 팔자</h3>
      <table style="width: 100%; text-align: center; font-size: 1.2em; border-collapse: collapse;">
        <tr style="border-bottom: 1px solid #ffedda; color: #d35400;">
          <th>시주(時)</th><th>일주(日)</th><th>월주(月)</th><th>년주(年)</th>
        </tr>
        <tr style="font-weight: bold; padding-top: 10px; color: #e67e22;">
          <td>${hourPillar}</td><td><span style="color: #f39c12;">${dayPillar}</span></td><td>${monthPillar}</td><td>${yearPillar}</td>
        </tr>
      </table>
    </div>
  `;
  document.getElementById("sajuTable").innerHTML = tableHtml;

  // sajuDatabase 확인
  if (typeof sajuDatabase === 'undefined') {
    alert("데이터를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
    return;
  }

  let resultData = sajuDatabase[dayPillar];
  
  // 상세 풀이 데이터가 없는 경우 Fallback 실행
  if (!resultData) {
    resultData = getFallbackSajuData(dayPillar, saju.getDayGan().toString());
  }

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
      }
  }, 1500);
}

// 상세 풀이가 없을 때 보여줄 기본 운세 정보 생성 함수
function getFallbackSajuData(pillar, gan) {
  const ganInfo = {
    "甲": { desc: "쭉쭉 뻗은 거목 같은 기운이네. 정직하고 추진력이 좋긴 한데, 너무 뻣뻣해서 부러질까 봐 걱정이다. 유연성 좀 키워!", tags: ["#정직", "#추진력", "#강직함"] },
    "乙": { desc: "끈질긴 생명력의 화초 같구만. 겉은 부드러워 보여도 속은 독종이지? 적응력 하나는 끝내주니까 어디서든 잘 살 거야.", tags: ["#적응력", "#생명력", "#외유내강"] },
    "丙": { desc: "하늘에 뜬 태양 같은 존재네! 열정적이고 밝아서 주변 사람들까지 환하게 만드는데, 그 급한 성격 좀 죽여라!", tags: ["#열정", "#밝음", "#급한성격"] },
    "丁": { desc: "어둠을 밝히는 등불 같은 기운이야. 섬세하고 따뜻해서 상담가 기질이 있네. 근데 속으로 삭히지 말고 표현 좀 하고 살아!", tags: ["#따뜻함", "#섬세함", "#사려깊음"] },
    "戊": { desc: "듬직한 태산 같은 사람이구만. 믿음직스럽고 묵직해서 사람들이 너한테 많이 의지하지? 가끔은 무거우니까 너도 좀 내려놔.", tags: ["#신뢰", "#듬직함", "#중재자"] },
    "己": { desc: "만물을 길러내는 비옥한 땅이네. 포용력도 좋고 현실적인 감각이 뛰어나구만. 남들 챙기느라 정작 네 텃밭 망치지 말고!", tags: ["#포용력", "#현실적", "#어머니마음"] },
    "庚": { desc: "날카로운 칼이나 거대한 바위 같네. 정의감 넘치고 결단력이 예술이야. 근데 너무 차가워서 주변 사람들 베일까 봐 무섭다!", tags: ["#정의감", "#결단력", "#카리스마"] },
    "辛": { desc: "반짝이는 보석이나 정밀한 가공품이네. 예리하고 세밀해서 완벽주의자 소리 듣지? 너무 예민하게 굴지 마, 피곤해.", tags: ["#섬세함", "#완벽주의", "#예리함"] },
    "壬": { desc: "넓은 바다 같은 포부를 가졌구만. 지혜롭고 흐름을 잘 읽어서 리더가 될 상이야. 근데 속을 알 수가 없어서 무섭네!", tags: ["#지혜", "#포용", "#변화무쌍"] },
    "癸": { desc: "대지를 적시는 단비 같은 존재야. 총명하고 유연해서 어디든 스며들지? 근데 생각이 너무 많아서 걱정을 사서 하는구만.", tags: ["#총명함", "#유연함", "#생각많음"] }
  };

  const info = ganInfo[gan] || { desc: "아직 내가 네 기운을 다 못 읽었어. 조만간 다시 와봐. 일단 넌 꽤 특별한 놈인 건 확실해!", tags: ["#신비로움", "#잠재력", "#미지의존재"] };

  return {
    title: `${pillar}의 기운을 타고난 당신 🐯`,
    tags: info.tags,
    coreSummary: info.desc,
    sections: [
      {
        title: "🐯 호랑이 수호신의 한마디",
        content: `네 일주(${pillar})에 대한 정밀 분석은 아직 불침번 서는 중이라 조금 늦어지고 있어. 하지만 네 중심 기운인 '${gan}'을 보니까 기본적으로 꽤 괜찮은 녀석이네. 너무 조급해하지 마.`
      },
      {
        title: "💡 기본 성향 분석",
        content: info.desc
      }
    ]
  };
}

function toggleAccordion(header) {
  header.classList.toggle('active');
  const content = header.nextElementSibling;
  content.style.display = content.style.display === "block" ? "none" : "block";
}
