import { test, describe, expect } from "vitest";
import { hashString, verifyHash } from "../../helpers/hashing";

const string1 = "https://mhouge.dk";
const string2 = "https://github.com/hougesen";

describe("hashString", async () => {
  test("able to hash string", async () => {
    const result1 = await hashString(string1);
    const result2 = await hashString(string2);

    expect(result1).toBeDefined();
    expect(result1).not.toEqual(string1);

    expect(result2).toBeDefined();
    expect(result2).not.toEqual(string2);
  });

  test("have correct length", async () => {
    expect((await hashString(string1)).length).toEqual(95);
    expect((await hashString(string2)).length).toEqual(95);
  });
});

describe("verifyString", async () => {
  test("verify correct input", async () => {
    const result1 = await verifyHash(await hashString(string1), string1);
    const result2 = await verifyHash(await hashString(string2), string2);

    expect(result1).toBe(true);
    expect(result2).toBe(true);
  });

  test("verify wrong input", async () => {
    const result1 = await verifyHash(await hashString(string1), string2);
    const result2 = await verifyHash(await hashString(string2), string1);

    expect(result1).toBe(false);
    expect(result2).toBe(false);
  });
});
