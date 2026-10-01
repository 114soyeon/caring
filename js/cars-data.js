// 렌터카 목록 데이터 (시안 01_렌터카 기준 10대)
// grade, fuel, seats, options는 필터 동작용 예시 값 — 실제 차량 정보로 바꿔서 쓰기
// price: 1주일 대여 가격(원)
const cars = [
  { id: 1, name: "2024 캐스퍼 가솔린 터보 디 에센셜", price: 238000, grade: "경형", fuel: "휘발유", seats: 4, options: ["내비", "블랙박스", "스마트키"], image: "images/cars/car-01.png" },
  { id: 2, name: "2026 쏘나타 디 엣지 가솔린 프리미엄", price: 326000, grade: "중형", fuel: "휘발유", seats: 5, options: ["내비", "블랙박스", "스마트키", "하이패스"], image: "images/cars/car-02.png" },
  { id: 3, name: "25~26 5인승 디 올뉴싼타페 가솔린 2WD 익스클루시브", price: 412000, grade: "SUV", fuel: "휘발유", seats: 5, options: ["내비", "블랙박스", "스마트키", "썬루프", "하이패스"], image: "images/cars/car-03.png" },
  { id: 4, name: "2025 디 올뉴그랜저 가솔린 프리미엄", price: 430000, grade: "대형", fuel: "휘발유", seats: 5, options: ["내비", "블랙박스", "스마트키", "하이패스"], image: "images/cars/car-04.png" },
  { id: 5, name: "2023 9인승 가솔린 카니발 프레스티지", price: 484400, grade: "승합", fuel: "휘발유", seats: 9, options: ["내비", "블랙박스", "스마트키", "하이패스"], image: "images/cars/car-05.png" },
  { id: 6, name: "23~24년 더뉴 레이 가솔린", price: 220000, grade: "경형", fuel: "휘발유", seats: 4, options: ["내비", "블랙박스"], image: "images/cars/car-06.png" },
  { id: 7, name: "2025 더 뉴아반떼 가솔린 모던", price: 246000, grade: "소형", fuel: "휘발유", seats: 5, options: ["내비", "블랙박스", "스마트키"], image: "images/cars/car-07.png" },
  { id: 8, name: "2026 더 뉴셀토스 가솔린 2WD 트렌디", price: 268000, grade: "SUV", fuel: "휘발유", seats: 5, options: ["내비", "블랙박스", "스마트키"], image: "images/cars/car-08.png" },
  { id: 9, name: "2024 E200 아방가르드 2.0 가솔린", price: 718000, grade: "수입", fuel: "휘발유", seats: 5, options: ["내비", "블랙박스", "스마트키", "썬루프", "하이패스"], image: "images/cars/car-09.png" },
  { id: 10, name: "2023 A6 45 TFSI 가솔린 프리미엄", price: 610000, grade: "수입", fuel: "휘발유", seats: 5, options: ["내비", "블랙박스", "스마트키", "썬루프"], image: "images/cars/car-10.png" },
];
