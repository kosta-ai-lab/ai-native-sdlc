// 총액(total)을 인원수(people)로 똑같이 나눈 1인 부담금을 돌려준다.
// 주의: 나누어 떨어지지 않으면 남는 금액은 버려진다.
export function splitEvenly(total, people) {
  if (!Number.isInteger(total) || total < 0) {
    throw new Error("총액은 0 이상의 정수여야 합니다.");
  }
  if (!Number.isInteger(people) || people < 1) {
    throw new Error("인원수는 1 이상의 정수여야 합니다.");
  }
  return Math.floor(total / people);
}
