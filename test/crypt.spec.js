const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const expect = require('chai').expect;
const { Crypt, toUrlSafeBase64, fromUrlSafeBase64 } = require("./../src/crypt");

const shuffle = (a) => {
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    // eslint-disable-next-line no-param-reassign
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

describe("Testing Crypt", () => {
  it("Testing Custom Base64 Encoding", () => {
    for (let i = 1; i < 2048; i += 1) {
      const data = crypto.randomBytes(i);
      const encoded = toUrlSafeBase64(data);
      expect(["0", "1", "2"]).to.contain(encoded[encoded.length - 1]);
      expect(/^[A-Za-z0-9\-_]+$/g.test(encoded)).to.equal(true);
      const decoded = fromUrlSafeBase64(encoded);
      expect(Buffer.compare(data, decoded)).to.equal(0);
    }
  });

  it("Testing Different Length", () => {
    for (let i = 1; i < 1024; i += 1) {
      const crypt = Crypt(crypto.randomBytes(256));
      const data = crypto.randomBytes(i);
      const encrypted = crypt.encrypt(data);
      expect(["0", "1", "2"]).to.contain(encrypted[encrypted.length - 1]);
      expect(/^[A-Za-z0-9\-_]+$/g.test(encrypted)).to.equal(true);
      const output = crypt.decrypt(encrypted);
      expect(Buffer.compare(data, output)).to.equal(0);
    }
  });

  it("Testing Random Text", () => {
    const text = fs.readFileSync(path.join(__dirname, "data.txt"), "utf8");
    const words = text.split(" ");
    for (let i = 1; i < 1024; i += 1) {
      const crypt = Crypt(crypto.randomBytes(256));
      const randomText = shuffle(words).slice(0, Math.floor(Math.random() * words.length)).join(" ");
      const data = Buffer.from(randomText);
      const encrypted = crypt.encrypt(data);
      const output = crypt.decrypt(encrypted);
      expect(Buffer.compare(data, output)).to.equal(0);
    }
  });

  it("Testing Unique Representation", () => {
    for (let i = 1; i < 16; i += 1) {
      const crypt = Crypt(crypto.randomBytes(256));
      const data = crypto.randomBytes(i);
      const hashSet = {};
      for (let j = 0; j < 1024; j += 1) {
        hashSet[crypt.encrypt(data)] = true;
      }
      expect(Object.keys(hashSet).length).to.equal(1024);
    }
  });

  it("Testing Incorrect Secret", () => {
    for (let i = 1; i < 2048; i += 1) {
      const crypt1 = Crypt(crypto.randomBytes(256));
      const crypt2 = Crypt(crypto.randomBytes(256));
      const data = crypto.randomBytes(i);
      const encrypted = crypt1.encrypt(data);
      try {
        const output = crypt2.decrypt(encrypted);
        expect(Buffer.compare(data, output)).to.not.equal(0);
      } catch (e) {
        expect(e.message).to.contain(":bad decrypt");
      }
    }
  });

  it("Testing Incorrect IV", () => {
    for (let i = 1; i < 2048; i += 1) {
      const crypt = Crypt(crypto.randomBytes(256));
      const data = crypto.randomBytes(i);
      const encrypted = crypt.encrypt(data);
      const newIV = crypto.randomBytes(128);
      const buffer = fromUrlSafeBase64(encrypted);
      newIV.copy(buffer);
      const modifiedEncrypted = toUrlSafeBase64(buffer);
      try {
        const output = crypt.decrypt(modifiedEncrypted);
        expect(Buffer.compare(data, output)).to.not.equal(0);
      } catch (e) {
        expect([
          ":bad decrypt",
          "incorrect header check",
          "unknown compression method"
        ].some(needle => e.message.indexOf(needle) !== -1)).to.equal(true);
      }
    }
  });
});
