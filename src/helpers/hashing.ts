import argon2 from "argon2";

export async function hashString(input: string): Promise<string | null> {
  try {
    const hash = await argon2.hash(input);

    return hash;
  } catch (error) {
    console.error("Error hashing string", error);

    return null;
  }
}

export async function verifyHash(hash: string, input: string): Promise<boolean> {
  return argon2.verify(hash, input).catch((error) => {
    console.error("error verifying hash", error);

    return false;
  });
}
