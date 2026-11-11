import { splitEvenly } from "./split.js";

// 사용법: node src/cli.js <총액> <인원수>
const [total, people] = process.argv.slice(2).map(Number);

try {
  const share = splitEvenly(total, people);
  console.log(`1인당 ${share.toLocaleString("ko-KR")}원`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
