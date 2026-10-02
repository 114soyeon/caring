// 렌터카: 필터(모델명, 등급, 연료, 옵션, 기간, 가격)로 차량 목록 거르기 + 카드 펼치기
// cars 배열은 cars-data.js에 있음 (이 파일보다 먼저 불러옴)

const carList = document.querySelector("#carList");
const carEmpty = document.querySelector("#carEmpty");
const filter = document.querySelector("#filter");
const modelInput = document.querySelector("#modelInput");
const priceMin = document.querySelector("#priceMin");
const priceMax = document.querySelector("#priceMax");
const priceText = document.querySelector("#priceText");
const priceTrack = document.querySelector("#priceTrack");

const arrowIcon = '<svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>';
const today = new Date().toLocaleDateString("sv-SE"); // 2026-10-02 형식
const customRange = {}; // 차량별로 직접 바꾼 시간 { 차이름: { start: "2026-10-05T10:00", end: "2026-10-07T22:00" } }

// 숫자 → 238,000
function formatPrice(price) {
    return price.toLocaleString("ko-KR");
}

// 기간 설정 (표시 글자, 기본 시작/종료 시각) - 모든 차 공통
const PERIOD_LABEL = { "1일": "1일", "1주": "1주일", "1개월": "1개월" };
const PERIOD_TIME = {
    "1일": { start: "10:00", end: "10:00" },
    "1주": { start: "10:00", end: "10:00" },
    "1개월": { start: "10:00", end: "10:00" },
};

const WEEKDAY = ["일", "월", "화", "수", "목", "금", "토"];
const pad = (n) => String(n).padStart(2, "0");

// 날짜 → 10.03(토)
function formatDate(d) {
    return `${pad(d.getMonth() + 1)}.${pad(d.getDate())}(${WEEKDAY[d.getDay()]})`;
}

// 날짜+시간 → 10.03(토) 19:00
function formatDateTime(d) {
    return `${formatDate(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// 날짜 → 입력칸 값 (2026-10-03T19:00)
function toInputValue(d) {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// 시작~종료 → 5일 3시간 (0시간도 표시)
function formatDuration(start, end) {
    const totalMin = Math.max(0, Math.round((end - start) / 60000));
    const d = Math.floor(totalMin / 1440);
    const h = Math.floor((totalMin % 1440) / 60);
    const m = totalMin % 60;
    return `${d}일 ${h}시간${m ? ` ${m}분` : ""}`;
}

// 차량의 시작/종료 시각: 직접 바꿨으면 그 값, 아니면 기간별 기본값 (시작은 오늘)
function getRange(carName, period) {
    const custom = customRange[carName];
    if (custom) return { start: new Date(custom.start), end: new Date(custom.end) };

    const t = PERIOD_TIME[period];
    const [sh, sm] = t.start.split(":").map(Number);
    const [eh, em] = t.end.split(":").map(Number);

    const start = new Date();
    start.setHours(sh, sm, 0, 0);

    const end = new Date(start);
    if (period === "1일") end.setDate(end.getDate() + 1);
    if (period === "1주") end.setDate(end.getDate() + 7);
    if (period === "1개월") end.setMonth(end.getMonth() + 1);
    end.setHours(eh, em, 0, 0);

    return { start, end };
}

// 기간별 가격: 기존 price를 1주 가격으로 보고 자동 계산 (비율은 바꿔도 됨)
function getPrice(car, period) {
    if (period === "1일") return Math.round((car.price * 0.2) / 1000) * 1000;
    if (period === "1개월") return Math.round((car.price * 3.5) / 1000) * 1000;
    return car.price; // 1주
}

// 차량별 대수: 데이터에 total/available이 있으면 그 값을, 없으면 차 이름으로 고정된 값을 만듦
function getStock(car) {
    if (car.total != null && car.available != null) {
        return { total: car.total, available: car.available };
    }
    let h = 0;
    for (const ch of car.name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const total = 5 + (h % 16);
    const available = 1 + ((h >>> 4) % Math.min(total, 9));
    return { total, available };
}

// 라디오 그룹에서 선택된 값 (기간은 선택 전이면 "1주", 나머지는 "전체")
function getChecked(name) {
    const checked = document.querySelector(`input[name="${name}"]:checked`);
    if (checked) return checked.value;
    return name === "period" ? "1주" : "전체";
}

// 지금 필터 조건에 맞는 차만
function getFilteredCars(period) {
    const keyword = modelInput.value.trim();
    const grade = getChecked("grade");
    const fuel = getChecked("fuel");
    const option = getChecked("option");
    const min = Number(priceMin.value);
    const max = Number(priceMax.value);

    return cars.filter((car) => {
        if (keyword && !car.name.includes(keyword)) return false;
        if (grade !== "전체" && car.grade !== grade) return false;
        if (fuel !== "전체" && car.fuel !== fuel) return false;
        if (option !== "전체" && !car.options.includes(option)) return false;
        const price = getPrice(car, period);
        return price >= min && price <= max;
    });
}

// 차량 카드 그리기
function renderCars() {
    const period = getChecked("period");
    const list = getFilteredCars(period);

    carList.innerHTML = list
        .map((car) => {
            const { start, end } = getRange(car.name, period);

            return `
            <li class="car-card" data-name="${car.name}" data-period="${period}">
                <button type="button" class="car-toggle" aria-label="상세 보기">${arrowIcon}</button>
                <p class="car-stock">총 ${getStock(car).total}대의 차량 중 <span class="num">${getStock(car).available}</span>대가 예약이 가능합니다.</p>
                <img src="${car.image}" alt="${car.name}">
                <h3 class="car-name">${car.name}</h3>
                <p class="car-price">${formatPrice(getPrice(car, period))}원 <span>/ ${PERIOD_LABEL[period]}</span></p>
                <div class="car-detail">
                    <p><b>시작시간 :</b> <span class="start-text">${formatDateTime(start)}</span></p>
                    <p><b>종료시간 :</b> <span class="end-text">${formatDateTime(end)}</span></p>
                    <p class="period-line">
                        <b>대여기간 :</b>
                        <span class="range-text">${formatDuration(start, end)}</span>
                        <button type="button" class="date-btn">시간변경</button>
                    </p>
                    <div class="time-edit" hidden>
                        <label>시작 <input type="datetime-local" class="start-input" min="${today}T00:00" value="${toInputValue(start)}"></label>
                        <label>종료 <input type="datetime-local" class="end-input" min="${today}T00:00" value="${toInputValue(end)}"></label>
                    </div>
                </div>
            </li>`;
        })
        .join("");

    carEmpty.hidden = list.length > 0;
}

// 가격 슬라이더: 글자, 파란 선 위치 맞추기 (최소가 최대를 넘지 않게)
function updatePrice() {
    if (Number(priceMin.value) > Number(priceMax.value)) {
        priceMin.value = priceMax.value;
    }
    const range = priceMin.max - priceMin.min;
    const left = ((priceMin.value - priceMin.min) / range) * 100;
    const right = ((priceMax.value - priceMin.min) / range) * 100;

    priceTrack.style.left = `${left}%`;
    priceTrack.style.width = `${right - left}%`;
    priceText.textContent = `${formatPrice(Number(priceMin.value))}원 ~ ${formatPrice(Number(priceMax.value))}원`;
}

// 직접 바꾼 시간 모두 지우기
function clearCustom() {
    Object.keys(customRange).forEach((key) => delete customRange[key]);
}

// 라디오, 슬라이더가 바뀌면 바로 다시 거르기 (이벤트 위임)
filter.addEventListener("input", (e) => {
    if (e.target === modelInput) return; // 모델명은 검색 버튼이나 엔터로
    if (e.target.name === "period") clearCustom(); // 기간을 바꾸면 직접 바꾼 시간은 초기화
    if (e.target === priceMin || e.target === priceMax) updatePrice();
    renderCars();
});

// 모델명 검색
document.querySelector("#modelSearchBtn").addEventListener("click", renderCars);
modelInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") renderCars();
});

// 초기화
document.querySelector("#filterReset").addEventListener("click", () => {
    modelInput.value = "";
    document.querySelectorAll('.filter input[value="전체"]').forEach((radio) => (radio.checked = true));
    document.querySelectorAll('input[name="period"]').forEach((radio) => (radio.checked = false));
    priceMin.value = priceMin.min;
    priceMax.value = priceMax.max;
    clearCustom();
    updatePrice();
    renderCars();
});

// 카드 안 클릭: 화살표(상세 펼치기/접기), 시간변경 버튼(입력칸 열기/닫기)
carList.addEventListener("click", (e) => {
    const toggle = e.target.closest(".car-toggle");
    if (toggle) { e.preventDefault(); e.stopPropagation(); 
        const card = toggle.closest(".car-card");
        if (card) {
            card.classList.toggle("is-open");
        }
        return;
    }

    const editBtn = e.target.closest(".date-btn");
    if (editBtn) { e.preventDefault(); e.stopPropagation(); 
        const box = editBtn.closest(".car-detail").querySelector(".time-edit");
        box.hidden = !box.hidden;
    }
});

// 시작/종료를 바꾸면: 시작시간, 종료시간, 대여기간 글자를 그 자리에서 바로 바꿈
carList.addEventListener("change", (e) => {
    if (!e.target.matches(".start-input, .end-input")) return;

    const card = e.target.closest(".car-card");
    const startInput = card.querySelector(".start-input");
    const endInput = card.querySelector(".end-input");
    if (!startInput.value || !endInput.value) return;

    const start = new Date(startInput.value);
    let end = new Date(endInput.value);

    // 종료가 시작보다 빠르면 1시간 뒤로 맞춤
    if (end <= start) {
        end = new Date(start.getTime() + 60 * 60 * 1000);
        endInput.value = toInputValue(end);
    }

    customRange[card.dataset.name] = { start: startInput.value, end: endInput.value };

    card.querySelector(".start-text").textContent = formatDateTime(start);
    card.querySelector(".end-text").textContent = formatDateTime(end);
    card.querySelector(".range-text").textContent = formatDuration(start, end);
});

// 대여 조건 검색: 아직 연결된 기능이 없어서 새로고침만 막아 둠
document.querySelector("#rentSearch").addEventListener("submit", (e) => {
    e.preventDefault();
});

updatePrice();
renderCars();

// 상단 히어로 슬라이더 (자동 전환)
(function () {
    const slides = document.querySelectorAll(".cars-hero .hero-slide");
    if (slides.length < 2) return;

    let current = 0;

    setInterval(() => {
        slides.forEach((s) => s.classList.remove("prev"));
        slides[current].classList.remove("active");
        slides[current].classList.add("prev");

        current = (current + 1) % slides.length;
        slides[current].classList.add("active");
    }, 4000);
})();

