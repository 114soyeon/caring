/* =========================================================
   돌하루팡 - 최저가 숙소 페이지
   ========================================================= */

const PER_PAGE = 4;
const MAX_PAGE_BUTTONS = 10;

// ----- 샘플 숙소 데이터 (실서비스에서는 API 응답으로 교체) -----
(function () {
  const slides = document.querySelectorAll(".hero .hero-slide");
  if (slides.length < 2) return;

  let current = 0;

  setInterval(() => {
    slides[current].classList.remove("active");
    current = (current + 1) % slides.length;
    slides[current].classList.add("active");
  }, 4000);
})();

const NAMES = [
  ["서귀포시 펜션 #석목집 #모던한옥 #", "서귀포시"],
  ["[오픈특가] 제주 독채 펜션 #통창유리 #", "제주시"],
  ["애월읍 펜션", "애월"],
  ["제주 아치트 #공항근처 #", "제주시"],
  ["중문 오션뷰 리조트", "중문"],
  ["성산 일출봉 게스트하우스", "성산"],
  ["협재 바다앞 스테이", "애월"],
  ["표선 감성 독채", "서귀포시"],
  ["함덕 비치 호텔", "제주시"],
  ["한림 돌담 민박", "애월"],
];
const AREAS = {
  제주시: [33.4996, 126.5312],
  서귀포시: [33.2541, 126.56],
  애월: [33.4627, 126.331],
  중문: [33.25, 126.412],
  성산: [33.458, 126.927],
};
const ROOM_TYPES = [
  "침실1개 · 침대1개 · 욕실1개",
  "침실2개 · 침대2개 · 욕실1개",
  "침실3개 · 침대3개 · 욕실2개",
];

// images/stays 폴더의 숙소 사진 (숙소 40개가 순서대로 돌아가며 사용)
const STAY_IMAGES = [
  "images/stays/숙소.png",
  "images/stays/숙소 (1).png",
  "images/stays/숙소 (2).png",
  "images/stays/숙소 (3).png",
];

const accommodations = Array.from({ length: 40 }, (_, i) => {
  const [name, area] = NAMES[i % NAMES.length];
  const [lat, lng] = AREAS[area];
  return {
    id: i + 1,
    name,
    area,
    lat: lat + Math.sin(i * 7.3) * 0.04,
    lng: lng + Math.cos(i * 3.1) * 0.06,
    rooms: ROOM_TYPES[i % ROOM_TYPES.length],
    guests: `최대 ${2 + (i % 5)}인`,
    price: 180000 + ((i * 97331) % 1500000),
    image: STAY_IMAGES[i % STAY_IMAGES.length],
    
    /*`https://picsum.photos/seed/jeju-stay-${i}/600/500`,*/
  };
});

// ----- 상태 -----
const state = {
  page: 1,
  items: accommodations,
  activeId: null,
};

// ----- DOM -----
const $list = document.getElementById("list");
const $pagination = document.getElementById("pagination");
const $empty = document.getElementById("emptyMsg");
const $form = document.getElementById("searchForm");
const $keyword = document.getElementById("keyword");
const $checkIn = document.getElementById("checkIn");
const $checkOut = document.getElementById("checkOut");

const won = (n) => "₩" + n.toLocaleString("ko-KR");
const krw = (n) => "KRW " + n.toLocaleString("ko-KR");

/* =========================================================
   지도 (Leaflet + OpenStreetMap)
   ========================================================= */
const map = L.map("map", {
  center: [33.38, 126.55],
  zoom: 10,
  scrollWheelZoom: false,
  attributionControl: true,
});
// tile.openstreetmap.org 는 Referer 없는 요청(file:// 로 연 페이지)을 403으로 막아서
// 같은 OpenStreetMap 데이터를 쓰는 OSM France 서버 사용
L.tileLayer("https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png", {
  subdomains: "abc",
  maxZoom: 20,
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://www.openstreetmap.fr">OpenStreetMap France</a>',
}).addTo(map);

// 지역 라벨
L.marker([33.39, 126.55], {
  icon: L.divIcon({
    html: '<span class="region-marker">📍 제주</span>',
    iconSize: null,
  }),
  interactive: false,
}).addTo(map);

const markerLayer = L.layerGroup().addTo(map);
const markers = new Map();

function renderMarkers(items) {
  markerLayer.clearLayers();
  markers.clear();
  items.forEach((item) => {
    const marker = L.marker([item.lat, item.lng], {
      icon: L.divIcon({
        html: `<span class="price-marker" data-id="${item.id}">${won(item.price)}</span>`,
        iconSize: null,
      }),
    });
    marker.on("click", () => focusItem(item.id, true));
    marker.addTo(markerLayer);
    markers.set(item.id, marker);
  });
  if (items.length) {
    map.fitBounds(L.latLngBounds(items.map((i) => [i.lat, i.lng])), {
      padding: [60, 60],
      maxZoom: 12,
    });
  }
}

function setActive(id) {
  state.activeId = id;
  document
    .querySelectorAll(".price-marker")
    .forEach((el) =>
      el.classList.toggle("is-active", Number(el.dataset.id) === id),
    );
  document
    .querySelectorAll(".card")
    .forEach((el) =>
      el.classList.toggle("is-active", Number(el.dataset.id) === id),
    );
  const marker = markers.get(id);
  if (marker) marker.setZIndexOffset(1000);
  markers.forEach((m, key) => key !== id && m.setZIndexOffset(0));
}

// 지도 마커 클릭 → 해당 카드가 있는 페이지로 이동
function focusItem(id, scrollToCard = false) {
  const index = state.items.findIndex((i) => i.id === id);
  if (index < 0) return;
  const page = Math.floor(index / PER_PAGE) + 1;
  if (page !== state.page) goToPage(page, false);
  setActive(id);
  if (scrollToCard) {
    document
      .querySelector(`.card[data-id="${id}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

/* =========================================================
   리스트 & 페이지네이션
   ========================================================= */
function renderList() {
  const start = (state.page - 1) * PER_PAGE;
  const pageItems = state.items.slice(start, start + PER_PAGE);

  $empty.hidden = state.items.length > 0;
  $list.innerHTML = pageItems
    .map(
      (item) => `
      <li class="card" data-id="${item.id}">
        <div class="card__thumb">
          <img src="${item.image}" alt="${item.name}" loading="lazy" />
        </div>
        <p class="card__title" title="${item.name}">${item.name}</p>
        <p class="card__meta">${item.rooms}</p>
        <p class="card__meta">${item.area} · ${item.guests}</p>
        <p class="card__price">${krw(item.price)}</p>
      </li>`,
    )
    .join("");
}

function renderPagination() {
  const total = Math.ceil(state.items.length / PER_PAGE);
  if (total <= 1) {
    $pagination.innerHTML = "";
    return;
  }

  const groupStart =
    Math.floor((state.page - 1) / MAX_PAGE_BUTTONS) * MAX_PAGE_BUTTONS + 1;
  const groupEnd = Math.min(groupStart + MAX_PAGE_BUTTONS - 1, total);

  let html = `<button data-page="${state.page - 1}" ${state.page === 1 ? "disabled" : ""} aria-label="이전">‹</button>`;
  for (let p = groupStart; p <= groupEnd; p++) {
    html += `<button data-page="${p}" class="${p === state.page ? "is-active" : ""}">${p}</button>`;
  }
  html += `<button data-page="${state.page + 1}" ${state.page === total ? "disabled" : ""} aria-label="다음">›</button>`;
  $pagination.innerHTML = html;
}

function goToPage(page, scroll = true) {
  const total = Math.ceil(state.items.length / PER_PAGE) || 1;
  state.page = Math.min(Math.max(page, 1), total);
  renderList();
  renderPagination();
  setActive(state.activeId);
  if (scroll)
    document
      .querySelector(".list-section")
      .scrollIntoView({ behavior: "smooth" });
}

$pagination.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-page]");
  if (btn && !btn.disabled) goToPage(Number(btn.dataset.page));
});

// 카드 hover/click ↔ 지도 마커 연동
$list.addEventListener("mouseover", (e) => {
  const card = e.target.closest(".card");
  if (card) setActive(Number(card.dataset.id));
});
$list.addEventListener("click", (e) => {
  const card = e.target.closest(".card");
  if (!card) return;
  const item = state.items.find((i) => i.id === Number(card.dataset.id));
  map.flyTo([item.lat, item.lng], 13, { duration: 0.8 });
  document.querySelector(".map-section").scrollIntoView({ behavior: "smooth" });
});

/* =========================================================
   검색
   ========================================================= */
$checkIn.addEventListener("change", () => {
  $checkOut.min = $checkIn.value;
});

$form.addEventListener("submit", (e) => {
  e.preventDefault();
  const keyword = $keyword.value.trim();

  if ($checkIn.value && $checkOut.value && $checkOut.value <= $checkIn.value) {
    alert("종료날짜는 시작날짜 이후로 선택해주세요.");
    return;
  }

  // 키워드 필터 후 가격 낮은 순 정렬
  state.items = accommodations
    .filter(
      (i) => !keyword || i.name.includes(keyword) || i.area.includes(keyword),
    )
    .sort((a, b) => a.price - b.price);
  state.activeId = null;

  renderMarkers(state.items);
  goToPage(1, false);
  document.querySelector(".map-section").scrollIntoView({ behavior: "smooth" });
});

/* ----- 초기 렌더 ----- */
renderMarkers(state.items);
goToPage(1, false);
