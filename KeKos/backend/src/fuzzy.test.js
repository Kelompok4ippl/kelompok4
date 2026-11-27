import { test } from "node:test";
import assert from "node:assert/strict";
import { fuzzifikasiJarak, fuzzifikasiRating, skorFuzzy } from "./fuzzy.js";

test("fuzzifikasi di titik batas", () => {
  assert.deepEqual(fuzzifikasiJarak(0.3), { dekat: 1, sedang: 0, jauh: 0 });
  assert.deepEqual(fuzzifikasiJarak(1), { dekat: 0.5, sedang: 0.5, jauh: 0 });
  assert.deepEqual(fuzzifikasiJarak(5), { dekat: 0, sedang: 0, jauh: 1 });
  assert.deepEqual(fuzzifikasiRating(4), { rendah: 0, sedang: 0.5, tinggi: 0.5 });
  assert.deepEqual(fuzzifikasiRating(0), { rendah: 1, sedang: 0, tinggi: 0 });
});

test("skor sesuai aturan pada titik tegas", () => {
  assert.equal(skorFuzzy(0.3, 5), 100); // dekat & tinggi → sangat tinggi
  assert.equal(skorFuzzy(5, 1), 25); // jauh & rendah → rendah
  assert.equal(skorFuzzy(1.5, 3.5), 50); // sedang & sedang → sedang
  // dekat 0.5 / sedang 0.5, rating sedang 0.5 / tinggi 0.5 → (75 + 100 + 50 + 75) / 4
  assert.equal(skorFuzzy(1, 4), 75);
});

test("lebih dekat atau rating lebih tinggi tidak pernah menurunkan skor", () => {
  for (let r = 0; r <= 5; r += 0.25) {
    for (let km = 0; km < 6; km += 0.1) {
      assert.ok(skorFuzzy(km, r) >= skorFuzzy(km + 0.1, r), `jarak ${km} rating ${r}`);
      if (r < 5) assert.ok(skorFuzzy(km, r + 0.25) >= skorFuzzy(km, r), `rating ${r} jarak ${km}`);
    }
  }
});
