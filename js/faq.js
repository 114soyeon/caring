// 자주 묻는 질문: 카테고리 탭, 질문 펼치기, 페이지 번호
// faqs 배열은 faq-data.js에 있음 (이 파일보다 먼저 불러옴)

const PER_PAGE = 10;

const faqList = document.querySelector("#faqList");
const pagination = document.querySelector("#pagination");
const tabs = document.querySelectorAll(".faq-tab");

let currentCategory = "전체";
let currentPage = 1;

const arrowIcon = '<svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>';

// 선택한 카테고리의 질문만
function getFilteredFaqs() {
    if (currentCategory === "전체") {
        return faqs;
    }
    return faqs.filter((faq) => faq.category === currentCategory);
}

// 질문 목록 그리기
function renderList() {
    const list = getFilteredFaqs();
    const start = (currentPage - 1) * PER_PAGE;
    const pageItems = list.slice(start, start + PER_PAGE);

    faqList.innerHTML = pageItems
        .map(
            (faq) => `
            <li class="faq-item">
                <button type="button" class="faq-question">
                    <span class="mark">Q</span>
                    <span class="text">${faq.question}</span>
                    ${arrowIcon}
                </button>
                <div class="faq-answer">
                    <span class="mark">A</span>
                    <div>${faq.answer}</div>
                </div>
            </li>`
        )
        .join("");

    // 첫 페이지 첫 질문은 펼친 상태로 (시안과 같게)
    if (currentPage === 1 && faqList.firstElementChild) {
        faqList.firstElementChild.classList.add("is-open");
    }
}

// 페이지 번호 그리기
function renderPagination() {
    const totalPages = Math.ceil(getFilteredFaqs().length / PER_PAGE);
    let html = `<button type="button" data-page="${currentPage - 1}" ${currentPage === 1 ? "disabled" : ""} aria-label="이전 페이지">&lt;</button>`;

    for (let page = 1; page <= totalPages; page++) {
        html += `<button type="button" data-page="${page}" class="${page === currentPage ? "is-active" : ""}">${page}</button>`;
    }

    html += `<button type="button" data-page="${currentPage + 1}" ${currentPage === totalPages ? "disabled" : ""} aria-label="다음 페이지">&gt;</button>`;
    pagination.innerHTML = html;
}

function render() {
    renderList();
    renderPagination();
}

// 질문 클릭: 누른 것만 펼치고 나머지는 접기 (이벤트 위임)
faqList.addEventListener("click", (e) => {
    const question = e.target.closest(".faq-question");
    if (!question) return;

    const item = question.parentElement;
    const wasOpen = item.classList.contains("is-open");

    faqList.querySelectorAll(".faq-item").forEach((el) => el.classList.remove("is-open"));
    if (!wasOpen) {
        item.classList.add("is-open");
    }
});

// 카테고리 탭 클릭
tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
        tabs.forEach((el) => el.classList.remove("is-active"));
        tab.classList.add("is-active");

        currentCategory = tab.dataset.category;
        currentPage = 1;
        render();
    });
});

// 페이지 번호 클릭
pagination.addEventListener("click", (e) => {
    const button = e.target.closest("button");
    if (!button || button.disabled) return;

    currentPage = Number(button.dataset.page);
    render();
    document.querySelector(".faq-card").scrollIntoView({ behavior: "smooth" });
});

render();
