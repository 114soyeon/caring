// 탑버튼
const btnTop = document.querySelector("#btnTop");

window.addEventListener("scroll", () => {
  btnTop.classList.toggle("is-show", window.scrollY > 300);
});

btnTop.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// floating
const floating = document.querySelector(".floating");
const footer = document.querySelector(".footer");

const FOOTER_GAP = 20; // 푸터와 상담톡 사이 간격(px)

function stopAboveFooter() {
  // 원래 위치(bottom 값)에서 상담톡 아래쪽 끝이 화면 어디에 오는지 계산
  const floatBottom =
    window.innerHeight - parseFloat(getComputedStyle(floating).bottom);
  const footerTop = footer.getBoundingClientRect().top;

  // 푸터 바로 위(FOOTER_GAP 만큼 띄워서)를 넘어가면 그만큼 위로 올려서 멈춘 것처럼 보이게
  const overlap = floatBottom - (footerTop - FOOTER_GAP);
  floating.style.transform = overlap > 0 ? `translateY(-${overlap}px)` : "";
}

window.addEventListener("scroll", stopAboveFooter);
window.addEventListener("resize", stopAboveFooter);
stopAboveFooter();
