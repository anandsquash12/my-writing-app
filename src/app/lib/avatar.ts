export function withAvatarVersion(avatarURL: string, avatarUpdatedAt: number): string {
  if (!avatarURL) {
    return "";
  }

  const joiner = avatarURL.includes("?") ? "&" : "?";
  return `${avatarURL}${joiner}v=${avatarUpdatedAt || 0}`;
}

export function getInitial(value: string, fallback = "U"): string {
  const trimmedValue = value.trim();
  return (trimmedValue.charAt(0) || fallback).toUpperCase();
}
