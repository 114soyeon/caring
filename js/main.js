// 메인: 슬라이더, 검색, 날씨, 이용 고객 숫자 올라가기, 실시간 예약 굴리기, 맨 위로 버튼

/* ---------- 1. 슬라이더 ---------- */
const slider = document.querySelector("#slider");
const slides = document.querySelectorAll(".slide");
const slidePrev = document.querySelector("#slidePrev");
const slidePause = document.querySelector("#slidePause");
const slideNext = document.querySelector("#slideNext");

const SLIDE_DELAY = 3000;
let slideIndex = 0;
let slideTimer = null;
let isPaused = false;

// dir: 1 = 다음(오른쪽에서 들어옴), -1 = 이전(왼쪽에서 들어옴)
function showSlide(index, dir = 1) {
  const nextIndex = (index + slides.length) % slides.length;
  if (nextIndex === slideIndex) return;

  const current = slides[slideIndex];
  const next = slides[nextIndex];

  // 들어올 슬라이드를 애니메이션 없이 시작 위치에 먼저 놓기
  next.style.transition = "none";
  next.style.transform = `translateX(${dir * 100}%)`;
  next.offsetWidth; // 위치 바로 적용

  // 애니메이션 켜고 이동: 현재 것은 반대쪽으로 나가고, 다음 것은 가운데로
  next.style.transition = "";
  next.style.transform = "";
  current.style.transform = `translateX(${-dir * 100}%)`;

  current.classList.remove("is-active");
  next.classList.add("is-active");
  slideIndex = nextIndex;
}

function startSlide() {
  clearInterval(slideTimer);
  slideTimer = setInterval(() => showSlide(slideIndex + 1), SLIDE_DELAY);
}

function stopSlide() {
  clearInterval(slideTimer);
}

slidePrev.addEventListener("click", () => {
  showSlide(slideIndex - 1, -1);
  if (!isPaused) startSlide(); // 누르면 타이머 다시 시작
});

// 다음: 일시정지 중이었어도 다시 자동 재생
slideNext.addEventListener("click", () => {
  showSlide(slideIndex + 1);
  isPaused = false;
  startSlide();
});

// 일시정지: 누르면 그 자리에서 멈춤
slidePause.addEventListener("click", () => {
  isPaused = true;
  stopSlide();
});

// 마우스 올리면 잠깐 멈춤
slider.addEventListener("mouseenter", stopSlide);
slider.addEventListener("mouseleave", () => {
  if (!isPaused) startSlide();
});

startSlide();

/* ---------- 2. 대여 조건 검색 ---------- */
const mainSearch = document.querySelector("#mainSearch");
const searchPlace = document.querySelector("#searchPlace");
const searchStart = document.querySelector("#searchStart");
const searchEnd = document.querySelector("#searchEnd");
const startPicker = document.querySelector("#startPicker");
const endPicker = document.querySelector("#endPicker");

// 오늘 날짜 yyyy-mm-dd
function toDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// 2026-10-02 → 2026.10.02 (금)
function toDisplayDate(value) {
  const [y, m, d] = value.split("-");
  const week = "일월화수목금토"[new Date(y, m - 1, d).getDay()];
  return `${y}.${m}.${d} (${week})`;
}

startPicker.min = toDateString(new Date());
endPicker.min = startPicker.min;

// 달력 아이콘이나 날짜 칸을 누르면 달력이 열림
function openPicker(picker) {
  if (picker.showPicker) {
    picker.showPicker();
  } else {
    picker.focus(); // showPicker를 지원하지 않는 옛 브라우저
    picker.click();
  }
}

document.querySelectorAll(".date-icon").forEach((icon) => {
  icon.addEventListener("click", (e) => {
    e.preventDefault(); // label 기본 동작 막기 (두 번 열리지 않게)
    openPicker(document.getElementById(icon.dataset.picker));
  });
});

searchStart.addEventListener("click", () => openPicker(startPicker));
searchEnd.addEventListener("click", () => openPicker(endPicker));

// 대여 날짜를 고르면 칸에 표시 + 반납 날짜는 그 이후만
startPicker.addEventListener("change", () => {
  searchStart.value = startPicker.value ? toDisplayDate(startPicker.value) : "";
  endPicker.min = startPicker.value || startPicker.min;
  if (endPicker.value && endPicker.value < startPicker.value) {
    endPicker.value = "";
    searchEnd.value = "";
  }
});

endPicker.addEventListener("change", () => {
  searchEnd.value = endPicker.value ? toDisplayDate(endPicker.value) : "";
});

mainSearch.addEventListener("submit", (e) => {
  e.preventDefault();

  const fields = [searchPlace, searchStart, searchEnd];
  let firstEmpty = null;

  fields.forEach((input) => {
    const empty = !input.value.trim();
    input.closest(".search-field").classList.toggle("is-error", empty);
    if (empty && !firstEmpty) firstEmpty = input;
  });

  if (firstEmpty) {
    firstEmpty.focus();
    return;
  }

  const params = new URLSearchParams({
    place: searchPlace.value.trim(),
    start: startPicker.value,
    end: endPicker.value,
  });
  location.href = `cars.html?${params}`;
});

mainSearch.addEventListener("input", (e) => {
  e.target.closest(".search-field").classList.remove("is-error");
});

/* ---------- 3. 제주 날씨 ---------- */
// 요일은 오늘부터 하루씩 자동 계산됩니다. 기온은 Open-Meteo(무료, 키 없음)에서 받아오고,
// 받아오지 못하면 아래 기본 데이터(오늘부터 순서대로)를 보여줍니다.
const WEEK_DAYS = 7;
const DOW = "일월화수목금토";

let weatherToday = { type: "sunny", temp: 22, text: "맑음" };
let weatherWeek = [
  { type: "sunny", high: 22, low: 18 },
  { type: "sunny", high: 23, low: 18 },
  { type: "partly", high: 24, low: 18 },
  { type: "cloudy", high: 21, low: 17 },
  { type: "rainy", high: 19, low: 15 },
  { type: "partly", high: 23, low: 18 },
  { type: "cloudy", high: 21, low: 17 },
];

// 날씨 코드(WMO) → 아이콘 종류 / 문구
const codeToType = (c) =>
  c <= 1 ? "sunny" : c === 2 ? "partly" : c <= 48 ? "cloudy" : "rainy";
const codeToText = (c) =>
  c <= 1 ? "맑음" : c === 2 ? "구름 조금" : c <= 48 ? "흐림" : "비";

const WEATHER_URL =
  "https://api.open-meteo.com/v1/forecast?latitude=33.4996&longitude=126.5312" +
  "&daily=weathercode,temperature_2m_max,temperature_2m_min" +
  "&current=temperature_2m,weathercode&timezone=Asia%2FSeoul&forecast_days=" +
  WEEK_DAYS;

const sun = `
    <circle cx="16" cy="16" r="6" fill="#ffb52b"/>
    <g stroke="#ffc85a" stroke-width="2" stroke-linecap="round">
        <path d="M16 3v3M16 26v3M3 16h3M26 16h3M6.8 6.8l2.1 2.1M23.1 23.1l2.1 2.1M6.8 25.2l2.1-2.1M23.1 8.9l2.1-2.1"/>
    </g>`;
const cloud = (y = 0, color = "#7dbbf6") =>
  `<path transform="translate(0 ${y})" fill="${color}" d="M9 26a6 6 0 0 1-.6-12A8 8 0 0 1 24 12.5 5.5 5.5 0 0 1 24.5 26z"/>`;

const weatherIcons = {
  sunny: sun,
  partly: `<g transform="translate(6 -4) scale(.75)">${sun}</g>${cloud(2, "#a9d2fa")}`,
  cloudy: cloud(0),
  rainy: `${cloud(-4)}
        <g stroke="#3d95f2" stroke-width="1.8" stroke-linecap="round">
            <path d="M11 25l-1 4M16 25l-1 4M21 25l-1 4"/>
        </g>`,
};

function weatherSvg(type) {
  return `<svg class="w-icon" viewBox="0 0 32 32" aria-hidden="true">${weatherIcons[type]}</svg>`;
}

// 화면 그리기: i번째 칸 = 오늘 + i일 (월말/연말도 자동으로 넘어감)
function renderWeather() {
  const now = new Date();

  document.querySelector("#weatherToday").innerHTML = `
    ${weatherSvg(weatherToday.type)}
    <strong class="today-temp">${weatherToday.temp}°</strong>
    <p class="today-text"><span>제주 날씨</span>${weatherToday.text}</p>
`;

  document.querySelector("#weatherWeek").innerHTML = weatherWeek
    .slice(0, WEEK_DAYS)
    .map((w, i) => {
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
      return `
        <li class="weather-day">
            <span class="w-name">${DOW[date.getDay()]}</span>
            ${weatherSvg(w.type)}
            <p class="w-temp"><b>${w.high}°</b><small>${w.low}°</small></p>
        </li>`;
    })
    .join("");
}

renderWeather(); // 먼저 기본 데이터로 바로 표시

// 실제 예보를 받으면 오늘부터의 요일에 맞춰 최고/최저 기온을 교체
fetch(WEATHER_URL)
  .then((res) => res.json())
  .then((data) => {
    const d = data.daily;
    weatherWeek = d.time.map((_, i) => ({
      type: codeToType(d.weathercode[i]),
      high: Math.round(d.temperature_2m_max[i]),
      low: Math.round(d.temperature_2m_min[i]),
    }));
    weatherToday = {
      type: codeToType(data.current.weathercode),
      temp: Math.round(data.current.temperature_2m),
      text: codeToText(data.current.weathercode),
    };
    renderWeather();
  })
  .catch(() => {}); // 실패하면 기본 데이터 유지

// 페이지를 켜둔 채 자정이 지나면 요일을 다시 계산
(function scheduleMidnight() {
  const n = new Date();
  const next = new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1, 0, 0, 5);
  setTimeout(() => {
    renderWeather();
    scheduleMidnight();
  }, next - n);
})();

/* ---------- 4. 이용 고객 숫자 올라가기 ---------- */
const userCount = document.querySelector("#userCount");
let userTotal = Number(userCount.dataset.target);

function countUp(el, target, duration = 2000) {
  const start = performance.now();

  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // 끝에서 천천히
    el.textContent = Math.floor(target * eased).toLocaleString("ko-KR");
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// 화면에 보일 때 한 번만 실행
const countObserver = new IntersectionObserver(
  (entries) => {
    if (entries[0].isIntersecting) {
      countUp(userCount, userTotal);
      countObserver.disconnect();
    }
  },
  { threshold: 0.5 },
);
countObserver.observe(userCount);

/* ---------- 5. 실시간 예약 굴리기 ---------- */
const bookings = [
  { time: "7일 전", car: "현대 아반떼", place: "제주공항지점", user: "신OO" },
  {
    time: "7일 전",
    car: "현대 스타리아",
    place: "서귀포 중문지점",
    user: "김OO",
  },
  {
    time: "8일 전",
    car: "기아 레이",
    place: "함덕 해수욕장지점",
    user: "이OO",
  },
  { time: "8일 전", car: "기아 카니발", place: "성산일출봉지점", user: "박OO" },
  { time: "9일 전", car: "현대 싼타페", place: "제주공항지점", user: "김OO" },
  { time: "9일 전", car: "기아 K5", place: "애월 한담지점", user: "최OO" },
  { time: "10일 전", car: "제네시스 G80", place: "제주공항지점", user: "정OO" },
  {
    time: "10일 전",
    car: "테슬라 모델Y",
    place: "서귀포 중문지점",
    user: "강OO",
  },
  {
    time: "11일 전",
    car: "현대 캐스퍼",
    place: "협재 해수욕장지점",
    user: "윤OO",
  },
  {
    time: "11일 전",
    car: "기아 쏘렌토",
    place: "성산일출봉지점",
    user: "한OO",
  },
];

const carIcon = '<img src = "./images/main/car.png">';
const pinIcon = '<img src = "./images/main/pin.png">';
const userIcon = '<img src = "./images/main/user.png">';

const bookingList = document.querySelector("#bookingList");

bookingList.innerHTML = bookings
  .map(
    (b) => `
        <li class="booking-item">
            <span class="b-time">${b.time}</span>
            <strong class="b-car">${carIcon}${b.car}</strong>
            <span class="b-place">${pinIcon}${b.place}</span>
            <span class="b-user">${userIcon}${b.user}</span>
            <span class="b-badge">예약확정</span>
            <a href="cars.html" class="b-visit">방문</a>
        </li>`,
  )
  .join("");

const ROLL_DELAY = 2500;
let rollTimer = null;

// 한 줄 위로 올리고 → 맨 앞 줄을 맨 뒤로 보냄
function rollUp() {
  const first = bookingList.firstElementChild;
  const step =
    first.offsetHeight + parseFloat(getComputedStyle(first).marginBottom);

  bookingList.style.transform = `translateY(-${step}px)`;

  bookingList.addEventListener(
    "transitionend",
    () => {
      bookingList.classList.add("no-anim");
      bookingList.appendChild(first);
      bookingList.style.transform = "translateY(0)";
      bookingList.offsetHeight; // 위치 바로 적용
      bookingList.classList.remove("no-anim");
    },
    { once: true },
  );
}

function startRoll() {
  clearInterval(rollTimer);
  rollTimer = setInterval(rollUp, ROLL_DELAY);
}

const bookingRoll = document.querySelector("#bookingRoll");
bookingRoll.addEventListener("mouseenter", () => clearInterval(rollTimer));
bookingRoll.addEventListener("mouseleave", startRoll);

startRoll();
