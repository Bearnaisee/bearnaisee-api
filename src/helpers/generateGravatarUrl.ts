import md5 from "md5";

export default function generateGravatarUrl(email: string): string {
  if (email?.length) {
    const emailHash = md5(email.trim().toLowerCase());

    return `https://gravatar.com/avatar/${emailHash}?s=192&d=mp&r=x`;
  }

  return "http://www.gravatar.com/avatar/?d=mp&s=192&d=mp&r=x";
}
