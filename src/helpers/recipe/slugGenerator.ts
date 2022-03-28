export function slugGenerator(text: string): string {
  return encodeURI(
    text
      ?.trim()
      ?.replaceAll(" ", "-")
      ?.replaceAll(/[^a-z0-9-]/gi, "")
      ?.toLowerCase(),
  );
}

export function unslugText(text: string): string {
  const decodedURI = decodeURI(text)?.replaceAll("-", " ");
  return `${decodedURI[0].toUpperCase()}${decodedURI.slice(1, decodedURI?.length)}`;
}
