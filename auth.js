const crypto = require("node:crypto");
const { promisify } = require("node:util");

const scrypt = promisify(crypto.scrypt);
const SESSION_LIFETIME_SECONDS = 60 * 60 * 24 * 7;
const SCRYPT_OPTIONS = {
  N: 16384,
  r: 8,
  p: 1,
  maxmem: 64 * 1024 * 1024,
};

async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const derivedKey = await scrypt(password, salt, 64, SCRYPT_OPTIONS);
  return `scrypt$16384$8$1$${salt.toString("hex")}$${derivedKey.toString("hex")}`;
}

async function verifyPassword(password, passwordHash) {
  if (typeof passwordHash !== "string") return false;
  const parts = passwordHash.split("$");
  if (
    parts.length !== 6 ||
    parts[0] !== "scrypt" ||
    parts[1] !== "16384" ||
    parts[2] !== "8" ||
    parts[3] !== "1" ||
    !/^[a-f0-9]{32}$/.test(parts[4]) ||
    !/^[a-f0-9]{128}$/.test(parts[5])
  ) {
    return false;
  }

  const salt = Buffer.from(parts[4], "hex");
  const expected = Buffer.from(parts[5], "hex");
  const actual = await scrypt(password, salt, expected.length, SCRYPT_OPTIONS);
  return crypto.timingSafeEqual(actual, expected);
}

function signSessionPayload(payload, secret) {
  return crypto.createHmac("sha256", secret).update(payload).digest("base64url");
}

function createSessionToken(userId, secret, now = Date.now()) {
  if (!Number.isSafeInteger(userId) || userId <= 0) {
    throw new TypeError("A valid user id is required to create a session.");
  }
  const expiresAt = Math.floor(now / 1000) + SESSION_LIFETIME_SECONDS;
  const payload = `${userId}.${expiresAt}`;
  return `${payload}.${signSessionPayload(payload, secret)}`;
}

function verifySessionToken(token, secret, now = Date.now()) {
  if (typeof token !== "string" || typeof secret !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3 || !/^\d+$/.test(parts[0]) || !/^\d+$/.test(parts[1])) {
    return null;
  }

  const userId = Number(parts[0]);
  const expiresAt = Number(parts[1]);
  if (
    !Number.isSafeInteger(userId) ||
    userId <= 0 ||
    !Number.isSafeInteger(expiresAt) ||
    expiresAt <= Math.floor(now / 1000) ||
    expiresAt > Math.floor(now / 1000) + SESSION_LIFETIME_SECONDS + 1
  ) {
    return null;
  }

  const payload = `${parts[0]}.${parts[1]}`;
  const expected = Buffer.from(signSessionPayload(payload, secret), "base64url");
  if (!/^[A-Za-z0-9_-]+$/.test(parts[2])) return null;
  const provided = Buffer.from(parts[2], "base64url");
  if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) {
    return null;
  }

  return userId;
}

module.exports = {
  createSessionToken,
  hashPassword,
  verifyPassword,
  verifySessionToken,
};
