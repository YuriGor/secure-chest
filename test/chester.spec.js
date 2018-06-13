const crypto = require('crypto');
const expect = require('chai').expect;
const {
  Chester,
  DecryptionIntegrityError,
  DecryptionSignatureError,
  DecryptionTimeTravelError,
  DecryptionExpiredError
} = require("./../src/chester");

describe("Testing Chester", () => {
  it("Testing Different Length", () => {
    for (let i = 1; i < 1024; i += 1) {
      const chester = Chester(crypto.randomBytes(256));
      const data = crypto.randomBytes(i).toString("utf8");
      const chest = chester.lock(data);
      const output = chester.unlock(chest);
      expect(data).to.equal(output);
    }
  });

  it("Testing Integrity Error", () => {
    const chester1 = Chester(Buffer.from([0x00]));
    const chester2 = Chester(Buffer.from([0x01]));
    const data = Buffer.from([0x00]).toString("utf8");
    const chest = chester1.lock(data);
    expect(() => chester2.unlock(chest)).to.throw(DecryptionIntegrityError);
  });

  it("Testing Signature Error", () => {
    const chester1 = Chester(Buffer.from([0x8b]));
    const chester2 = Chester(Buffer.from([0xd2]));
    const data = Buffer.from([0x7b]).toString("utf8");
    const chest = chester1.lock(data);
    expect(() => chester2.unlock(chest)).to.throw(DecryptionSignatureError);
  });

  it("Testing Time Travel Error", () => {
    const secret = crypto.randomBytes(256);
    const chester1 = Chester(secret, { zeroTime: 0 });
    const chester2 = Chester(secret);
    const data = crypto.randomBytes(256).toString("utf8");
    const chest = chester1.lock(data);
    expect(() => chester2.unlock(chest)).to.throw(DecryptionTimeTravelError);
  });

  it("Testing Expired Error", () => {
    const secret = crypto.randomBytes(256);
    const chester1 = Chester(secret);
    const chester2 = Chester(secret, { zeroTime: 0 });
    const data = crypto.randomBytes(256).toString("utf8");
    const chest = chester1.lock(data);
    expect(() => chester2.unlock(chest)).to.throw(DecryptionExpiredError);
  });
});
