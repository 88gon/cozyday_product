// main.js

// 페이지 로드 시 초기화
function init() {
  try {
    initSelects();
    initEventListeners();
  } catch (e) {
    console.error("Initialization failed:", e);
  }
}

// 이벤트 리스너 설정 (기존 코드 유지 - 시간 모름 체크박스 로직)
function initEventListeners() {
    const unknownTimeCheckbox = document.getElementById('unknownTime');
    const hourSelect = document.getElementById('birthHour');
    const minuteSelect = document.getElementById('birthMinute');

    if (unknownTimeCheckbox) {
        unknownTimeCheckbox.addEventListener('change', function() {
            const isChecked = this.checked;
            hourSelect.disabled = isChecked;
            minuteSelect.disabled = isChecked;
            
            if (isChecked) {
                hourSelect.style.opacity = "0.5";
                minuteSelect.style.opacity = "0.5";
            } else {
                hourSelect.style.opacity = "1";
                minuteSelect.style.opacity = "1";
            }
        });
    }
}

// DOM 로드 확인 후 실행 (기존 코드 유지)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// 셀렉트 박스 초기화 (기존 코드 유지)
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

// 💥 [수정] MBTI 소울메이트 로직을 렌더링 함수 밖으로 분리 (관리 용이)
const mbtiSoulmateMap = {
    "甲": { mbti: "INFJ", char: "🌲", desc: "당신의 깊은 생각을 이해해줄 따뜻한 동반자", item: "싱그러운 숲향 향수" },
    "乙": { mbti: "INFJ", char: "🌿", desc: "당신의 성장을 묵묵히 응원해줄 다정한 예술가", item: "아기자기한 화분" },
    "丙": { mbti: "ISFJ", char: "☀️", desc: "당신의 뜨거운 열정을 조용히 받아줄 쉼터", item: "포근한 무릎 담요" },
    "丁": { mbti: "ISFJ", char: "🕯️", desc: "당신의 섬세한 감성을 따뜻하게 감싸줄 사람", item: "향기로운 캔들" },
    "戊": { mbti: "ESTP", char: "⛰️", desc: "당신의 단단한 내면에 활력을 불어넣어줄 활동가", item: "에너지 넘치는 러닝화" },
    "己": { mbti: "ESTP", char: "🏡", desc: "당신의 포용력에 실질적인 안정을 더해줄 파트너", item: "세련된 만년필" },
    "庚": { mbti: "ENFJ", char: "💎", desc: "당신의 날카로움을 부드럽게 감싸줄 카리스마 리더", item: "반짝이는 실버 반지" },
    "辛": { mbti: "ENFJ", char: "✨", desc: "당신의 예리함을 가치 있게 빛내줄 사람", item: "고급스러운 스카프" },
    "壬": { mbti: "INTP", char: "🌊", desc: "당신의 넓은 포부를 함께 논할 지적인 파트너", item: "노이즈 캔슬링 이어폰" },
    "癸": { mbti: "INTP", char: "💧", desc: "당신의 총명함을 깊이 이해해줄 아이디어 뱅크", item: "흥미로운 추리 소설" }
};

// 사주 계산 및 결과 출력 메인 함수 (기존 코드 유지 및 일부 수정)
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
  const isTimeUnknown = document.getElementById('unknownTime').checked;

  if(!yearVal || !monthVal || !dayVal) {
      alert("생년월일을 정확히 선택해주세요!");
      return;
  }

  const year = parseInt(yearVal);
  const month = parseInt(monthVal);
  const day = parseInt(dayVal);
  const gender = parseInt(genderVal);
  
  let hour = parseInt(hourVal);
  let minute = parseInt(minuteVal);
  
  if (isTimeUnknown) {
      hour = 12; // 시간을 모를 때 관습적으로 사용하는 정오
      minute = 0;
  }

  if (typeof Solar === 'undefined') {
    alert("라이브러리 로딩 중입니다. 잠시 후 다시 시도해주세요.");
    return;
  }

  const solar = Solar.fromYmdHms(year, month, day, hour, minute, 0);
  const lunar = solar.getLunar();
  const saju = lunar.getEightChar();
  
  const yearPillar = saju.getYear().toString();
  const monthPillar = saju.getMonth().toString();
  const dayPillar = saju.getDay().toString();
  // sajuData.js의 키 값 형식(Hanja)과 맞춥니다.
  const dayPillarKey = dayPillar; 
  const hourPillar = isTimeUnknown ? "모름" : saju.getTime().toString();

  document.getElementById('result').style.display = 'block';
  document.getElementById('resultTitle').innerText = `${name}님의 사주 결과`;

  // 명식 테이블 렌더링 (기존 코드 유지)
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

  // 💥 [확인 필수] sajuData.js가 로드되었는지 확인
  if (typeof sajuDatabase === 'undefined') {
    alert("데이터베이스를 불러오는 중입니다. 잠시 후 다시 시도해주세요. (sajuData.js 로드 확인 필요)");
    return;
  }

  // 💥 [수정] 생성된 키 값으로 sajuData.js에서 데이터를 가져옵니다.
  let resultData = sajuDatabase[dayPillarKey];
  if (!resultData) {
    console.warn(`Database entry not found for: ${dayPillarKey}, using fallback.`);
    resultData = getFallbackSajuData(dayPillar, saju.getDayGan().toString());
  }

  const resultArea = document.getElementById('resultArea');
  const loadingArea = document.getElementById('loadingArea');
  resultArea.innerHTML = '';
  loadingArea.style.display = 'block';
  
  const loadingMsg = document.querySelector('.loading-msg');
  if (loadingMsg) loadingMsg.innerText = "과거의 묵은 감정은 싹 다 태워버려. 내가 불침번 설 테니까 넌 새 출발이나 준비해.";

  setTimeout(() => {
      loadingArea.style.display = 'none';
      // 💥 [수정] 일주 키 값과 일간 정보를 넘겨줍니다.
      renderKeywordResult(resultData, dayPillarKey, saju.getDayGan().toString());
  }, 1500);
}

// 💥 [대폭 수정] 방대한 데이터를 화면에 렌더링하는 함수
function renderKeywordResult(data, dayPillar, dayGan) {
  const resultArea = document.getElementById('resultArea');
  
  // 분리해둔 MBTI 데이터 가져오기 (기본값 ENFP로 설정)
  let soulmateData = mbtiSoulmateMap[dayGan] || { mbti: "ENFP", char: "🌿", desc: "당신의 성장을 응원해줄 자유로운 영혼", item: "따뜻한 차 한 잔" };

  let html = `
    <div class="tiger-comment" style="background: #fdf5e6; padding: 18px; border-radius: 12px; margin-bottom: 25px; border-left: 6px solid #8d6e63; font-size: 1em; line-height: 1.7; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
      <strong style="font-size: 1.1em;">🐯 호랑이 수호신의 한마디:</strong><br>
      <span style="color: #5d4037; font-style: italic;">"${data.tigerComment || '오, 꽤 괜찮은 기운을 타고났는데? ...물론 내가 옆에서 지켜줘서 더 잘 풀리는 거겠지만.'}"</span>
    </div>
    
    <div class="core-summary" style="margin-bottom: 30px; padding: 0 10px;">
      <h3 style="color: #2c3e50; font-size: 1.5em; margin-bottom: 10px;">${data.title}</h3>
      <div class="tags" style="margin-bottom: 15px;">
        ${data.tags.map(tag => `<span class="tag" style="display: inline-block; background: #ffe0b2; color: #e65100; padding: 5px 10px; border-radius: 20px; font-size: 0.85em; margin-right: 5px; margin-bottom: 5px;">${tag}</span>`).join(' ')}
      </div>
      <p style="font-size: 1.05em; line-height: 1.8; color: #34495e; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">${data.coreSummary.replace(/\n/g, '<br>')}</p>
    </div>
  `;

  // 💥 [핵심 수정] 1000자 이상의 긴 텍스트를 담을 아코디언 섹션 배치
  // sajuData.js의 구조와 매핑됩니다.
  const categories = [
    { key: 'fiveElements', label: '오행 분석', icon: '☯️' },
    { key: 'personality', label: '성격 성품', icon: '👤' },
    { key: 'wealth', label: '재물 운세', icon: '💰' },
    { key: 'career', label: '직업 적성', icon: '💼' },
    { key: 'relationship', label: '인연 연애', icon: '💖' },
    { key: 'strategy', label: '성공 전략', icon: '💡' }
  ];

  categories.forEach(cat => {
    const content = data[cat.key];
    if (content) {
      // 💥 텍스트 볼륨이 크므로 <p> 태그와 줄바꿈 처리를 강화합니다.
      const formattedContent = content
        .split('\n') // 줄바꿈 기준으로 나누고
        .filter(paragraph => paragraph.trim() !== '') // 빈 줄 제거
        .map(paragraph => `<p style="margin-bottom: 15px; line-height: 1.8;">${paragraph.trim()}</p>`) // 각 문단을 <p>로 감쌈
        .join('');

      html += `
        <div class="accordion-item" style="border: 1px solid #ffedda; border-radius: 8px; margin-bottom: 10px; overflow: hidden; background: white;">
          <div class="accordion-header" onclick="toggleAccordion(this)" style="background-color: #fffbf5; padding: 15px 20px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; font-weight: bold; color: #d35400; transition: background 0.3s;">
            <span>${cat.icon} ${cat.label}</span>
            <span class="accordion-icon" style="transition: transform 0.3s;">▼</span>
          </div>
          <div class="accordion-content" style="display: none; padding: 20px 25px; border-top: 1px solid #ffedda; font-size: 0.98em; color: #4f4f4f; line-height: 1.8;">
            ${formattedContent}
          </div>
        </div>
      `;
    }
  });

  // 소울메이트 특별 섹션 (기존 코드 유지 및 스타일 소폭 개선)
  html += `
    <div class="soulmate-section" style="background: linear-gradient(135deg, #fff9db 0%, #fff3bf 100%); padding: 25px; border-radius: 15px; margin-top: 30px; text-align: center; border: 2px solid #ffec99; box-shadow: 0 4px 15px rgba(255,146,43,0.1);">
      <div class="soulmate-title" style="font-size: 1.3em; font-weight: bold; color: #e67e22; margin-bottom: 15px;">💖 49사주가 추천하는 나의 소울메이트</div>
      <span class="soulmate-character" style="font-size: 4em; display: block; margin-bottom: 10px;">${soulmateData.char}</span>
      <div class="soulmate-info">
        <div class="soulmate-mbti" style="font-size: 1.2em; font-weight: bold; color: #34495e;">${soulmateData.mbti} 성향</div>
        <div class="soulmate-desc" style="color: #7f8c8d; margin-bottom: 20px;">${soulmateData.desc}</div>
      </div>
      <div style="margin-top: 20px; padding: 18px; background: white; border-radius: 10px; font-size: 0.95em; box-shadow: 0 2px 5px rgba(0,0,0,0.05); line-height: 1.6;">
        <strong>🎁 호랑이가 던져주는 행운의 아이템:</strong><br>
        <span style="color: #e67e22; font-weight: bold; font-size: 1.15em;">[${soulmateData.item}]</span><br>
        <span style="color: #7f8c8d; font-style: italic; font-size: 0.9em;">"이거 무심하게 툭 던져두고 갈 테니까, 챙겨둬서 나쁠 거 없잖아?"</span>
      </div>
    </div>
  `;

  resultArea.innerHTML = html;
}

// 데이터 부재 시를 위한 대비책 (기존 코드 유지)
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

  const info = ganInfo[gan] || { desc: "아직 내가 네 기운을 다 못 읽었어. 조만간 다시 와봐.", tags: ["#신비로움", "#잠재력"] };

  return {
    title: `${pillar}의 기운을 타고난 당신 🐯`,
    tags: info.tags,
    coreSummary: info.desc,
    fiveElements: `네 중심 기운은 '${gan}'이야. 이 기운이 네 삶의 전반적인 흐름을 결정한다고 보면 돼.`,
    personality: info.desc,
    strategy: "네 일주에 대한 정밀 분석은 불침번 서는 중이라 조금 늦어지고 있어. 하지만 기본 기운만 봐도 넌 꽤 특별한 놈이야."
  };
}

// 💥 [수정] 아코디언 애니메이션 및 아이콘 변경 로직 추가
function toggleAccordion(header) {
  // 아이콘 회전
  const icon = header.querySelector('.accordion-icon');
  
  const content = header.nextElementSibling;
  if (content.style.display === "block") {
    content.style.display = "none";
    header.style.backgroundColor = "#fffbf5"; // 원래 색으로
    if(icon) icon.style.transform = "rotate(0deg)";
  } else {
    content.style.display = "block";
    header.style.backgroundColor = "#f7eadd"; // 열렸을 때 색
    if(icon) icon.style.transform = "rotate(180deg)";
  }
}