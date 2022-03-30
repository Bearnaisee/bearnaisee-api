export function slugGenerator(text: string): string {
  return encodeURI(
    text
      ?.trim()
      ?.replaceAll(" ", "-")
      ?.toLowerCase()
      ?.replaceAll(/[^a-z0-9-]/gi, ""),
  );
}

export function unslugText(text: string): string {
  const decodedURI = decodeURI(text)?.replaceAll("-", " ");
  return `${decodedURI[0].toUpperCase()}${decodedURI.slice(1, decodedURI?.length)}`;
}
