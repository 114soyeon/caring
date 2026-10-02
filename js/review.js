// 고객 만족 리뷰: 업체 선택, 정렬, 차종 키워드, 별점, 사진 리뷰 필터 + 페이지 번호
// reviews 배열은 review-data.js에 있음 (이 파일보다 먼저 불러옴)

const PER_PAGE = 9; // 3칸 × 3줄
const PAGE_GROUP = 10; // 페이지 번호는 10개씩 보여줌

const reviewList = document.querySelector("#reviewList");
const reviewEmpty = document.querySelector("#reviewEmpty");
const pagination = document.querySelector("#pagination");
const companySelect = document.querySelector("#companySelect");
const sortSelect = document.querySelector("#sortSelect");
const typeChips = document.querySelectorAll("#typeChips .chip");
const scoreChips = document.querySelectorAll("#scoreChips .chip[data-score]");

// 지금 고른 조건
let currentType = "전체";
let minScore = 0; // 0 = 별점 전체, 4 = 4점 이상
let photoOnly = false;
let currentPage = 1;

// 차종 → 카드에 보여줄 차 그림 (렌터카 페이지 이미지 재사용)
const carImages = {
    경차: "images/cars/car-06.png",
    "소형·준중형": "images/cars/car-07.png",
    중형: "images/cars/car-02.png",
    대형: "images/cars/car-04.png",
    "RV·SUV": "images/cars/car-03.png",
    승합: "images/cars/car-05.png",
    외제: "images/cars/car-09.png",
};

// 업체 선택 목록 채우기 (리뷰 많은 업체 순)
const companyCount = {};
reviews.forEach((review) => {
    companyCount[review.company] = (companyCount[review.company] || 0) + 1;
});
Object.keys(companyCount)
    .sort((a, b) => companyCount[b] - companyCount[a])
    .forEach((company) => {
        companySelect.innerHTML += `<option value="${company}">${company} (${companyCount[company]})</option>`;
    });

// 전기차는 실제 데이터에 차종 분류가 없어서 차 이름으로 찾음
function isElectric(review) {
    return /전기|EV|일렉트릭/.test(review.car);
}

// 지금 조건에 맞는 리뷰만, 정렬까지
function getFilteredReviews() {
    const company = companySelect.value;

    const list = reviews.filter((review) => {
        if (company && review.company !== company) return false;
        if (currentType === "전기차" && !isElectric(review)) return false;
        if (currentType !== "전체" && currentType !== "전기차" && review.carType !== currentType) return false;
        if (review.score < minScore) return false;
        if (photoOnly && !review.hasPhoto) return false;
        return true;
    });

    if (sortSelect.value === "high") {
        list.sort((a, b) => b.score - a.score);
    } else if (sortSelect.value === "low") {
        list.sort((a, b) => a.score - b.score);
    }
    return list; // 기본(최신순)은 데이터가 이미 최신순
}

// 고객이 쓴 글에 < > 같은 문자가 있어도 태그로 해석되지 않게
function escapeHtml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ★★★★☆
function stars(score) {
    return "★".repeat(score) + `<span class="off">${"★".repeat(5 - score)}</span>`;
}

// 리뷰 카드 그리기
function renderList(list) {
    const start = (currentPage - 1) * PER_PAGE;
    const pageItems = list.slice(start, start + PER_PAGE);

    reviewList.innerHTML = pageItems
        .map(
            (review) => `
            <li class="review-item">
                <a href="javascript:void(0)">
                    <div class="review-thumb">
                        <img src="${carImages[review.carType] || carImages["중형"]}" alt="${review.carType}">
                        ${review.hasPhoto ? '<span class="photo-badge">사진</span>' : ""}
                    </div>
                    <p class="review-stars" aria-label="별점 ${review.score}점">${stars(review.score)}</p>
                    <h3 class="review-title">${escapeHtml(review.title)}</h3>
                    <p class="review-text">${escapeHtml(review.body)}</p>
                    <p class="review-meta">${review.name} · ${review.date} · ${review.car}</p>
                </a>
            </li>`
        )
        .join("");

    reviewEmpty.hidden = list.length > 0;
}

// 페이지 번호 그리기 (10개씩 묶어서)
function renderPagination(list) {
    const totalPages = Math.ceil(list.length / PER_PAGE);
    if (totalPages <= 1) {
        pagination.innerHTML = "";
        return;
    }
    const groupStart = Math.floor((currentPage - 1) / PAGE_GROUP) * PAGE_GROUP + 1;
    const groupEnd = Math.min(groupStart + PAGE_GROUP - 1, totalPages);

    let html = `<button type="button" data-page="${currentPage - 1}" ${currentPage === 1 ? "disabled" : ""} aria-label="이전 페이지">&lt;</button>`;
    for (let page = groupStart; page <= groupEnd; page++) {
        html += `<button type="button" data-page="${page}" class="${page === currentPage ? "is-active" : ""}">${page}</button>`;
    }
    html += `<button type="button" data-page="${currentPage + 1}" ${currentPage === totalPages ? "disabled" : ""} aria-label="다음 페이지">&gt;</button>`;
    pagination.innerHTML = html;
}

function render() {
    const list = getFilteredReviews();
    renderList(list);
    renderPagination(list);
}

// 조건이 바뀌면 1페이지부터 다시
function applyFilter() {
    currentPage = 1;
    render();
}

companySelect.addEventListener("change", applyFilter);
sortSelect.addEventListener("change", applyFilter);

// 차종 키워드: 하나만 선택
typeChips.forEach((chip) => {
    chip.addEventListener("click", () => {
        typeChips.forEach((el) => el.classList.remove("is-active"));
        chip.classList.add("is-active");
        currentType = chip.dataset.type;
        applyFilter();
    });
});

// 별점: "별점 전체"와 "4점 이상"은 둘 중 하나, "사진 리뷰만"은 따로 켜고 끄기
scoreChips.forEach((chip) => {
    chip.addEventListener("click", () => {
        if (chip.dataset.score === "photo") {
            photoOnly = !photoOnly;
            chip.classList.toggle("is-active", photoOnly);
        } else {
            minScore = chip.dataset.score === "4" ? 4 : 0;
            scoreChips.forEach((el) => {
                if (el.dataset.score !== "photo") el.classList.toggle("is-active", el === chip);
            });
        }
        applyFilter();
    });
});

// 초기화
document.querySelector("#resetBtn").addEventListener("click", () => {
    companySelect.value = "";
    sortSelect.value = "recent";
    currentType = "전체";
    minScore = 0;
    photoOnly = false;
    typeChips.forEach((el) => el.classList.toggle("is-active", el.dataset.type === "전체"));
    scoreChips.forEach((el) => el.classList.toggle("is-active", el.dataset.score === "all"));
    applyFilter();
});

// 페이지 번호 클릭
pagination.addEventListener("click", (e) => {
    const button = e.target.closest("button");
    if (!button || button.disabled) return;
    currentPage = Number(button.dataset.page);
    render();
    document.querySelector(".review-card").scrollIntoView({ behavior: "smooth" });
});

render();
