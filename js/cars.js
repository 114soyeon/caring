// 렌터카: 필터(모델명, 등급, 연료, 옵션, 가격)로 차량 목록 거르기 + 카드 펼치기
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

// 숫자 → 238,000
function formatPrice(price) {
    return price.toLocaleString("ko-KR");
}

// 라디오 그룹에서 선택된 값
function getChecked(name) {
    return document.querySelector(`input[name="${name}"]:checked`).value;
}

// 지금 필터 조건에 맞는 차만
function getFilteredCars() {
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
        return car.price >= min && car.price <= max;
    });
}

// 차량 카드 그리기
function renderCars() {
    const list = getFilteredCars();

    carList.innerHTML = list
        .map(
            (car) => `
            <li class="car-card">
                <button type="button" class="car-toggle" aria-label="상세 보기">${arrowIcon}</button>
                <img src="${car.image}" alt="${car.name}">
                <h3 class="car-name">${car.name}</h3>
                <p class="car-price">${formatPrice(car.price)}원 <span>/ 1주일</span></p>
                <div class="car-detail">
                    <p><b>등급</b>${car.grade}</p>
                    <p><b>연료</b>${car.fuel}</p>
                    <p><b>인원</b>${car.seats}인승</p>
                    <p><b>옵션</b>${car.options.join(", ")}</p>
                </div>
            </li>`
        )
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

// 라디오, 슬라이더가 바뀌면 바로 다시 거르기 (이벤트 위임)
filter.addEventListener("input", (e) => {
    if (e.target === modelInput) return; // 모델명은 검색 버튼이나 엔터로
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
    priceMin.value = priceMin.min;
    priceMax.value = priceMax.max;
    updatePrice();
    renderCars();
});

// 카드 화살표: 상세 펼치기/접기
carList.addEventListener("click", (e) => {
    const toggle = e.target.closest(".car-toggle");
    if (!toggle) return;
    toggle.parentElement.classList.toggle("is-open");
});

// 대여 조건 검색: 아직 연결된 기능이 없어서 새로고침만 막아 둠
document.querySelector("#rentSearch").addEventListener("submit", (e) => {
    e.preventDefault();
});

updatePrice();
renderCars();
