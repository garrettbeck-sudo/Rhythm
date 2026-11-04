const test = require("node:test");
const assert = require("node:assert/strict");
const {
  createSessionToken,
  hashPassword,
  verifyPassword,
  verifySessionToken,
} = require("../auth");

const secret = "test-session-secret-that-is-long-enough";

test("passwords are stored as salted scrypt hashes", async () => {
  const first = await hashPassword("correct horse battery staple");
  const second = await hashPassword("correct horse battery staple");

  assert.match(first, /^scrypt\$16384\$8\$1\$/);
  assert.notEqual(first, second);
  assert.equal(await verifyPassword("correct horse battery staple", first), true);
  assert.equal(await verifyPassword("incorrect password", first), false);
});

test("signed sessions reject tampering, expiry, and another secret", () => {
  const now = 1_800_000_000_000;
  const token = createSessionToken(42, secret, now);

  assert.equal(verifySessionToken(token, secret, now), 42);
  assert.equal(verifySessionToken(token, "another-test-session-secret", now), null);
  assert.equal(verifySessionToken(`${token}x`, secret, now), null);
  assert.equal(verifySessionToken(token, secret, now + 8 * 24 * 60 * 60 * 1000), null);
});

test("a session requires a positive integer user id", () => {
  assert.throws(() => createSessionToken(0, secret));
  assert.throws(() => createSessionToken("42", secret));
});
