import { test } from "node:test";
import assert from "node:assert/strict";
import { splitEvenly } from "../src/split.js";

test("나누어 떨어지면 1인 부담금이 정확하다", () => {
  assert.equal(splitEvenly(30000, 3), 10000);
});

test("인원수가 0이면 에러를 던진다", () => {
  assert.throws(() => splitEvenly(30000, 0));
});
