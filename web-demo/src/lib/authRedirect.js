export function getCanonicalAuthUrl(inputUrl) {
  try {
    const parsed = new URL(inputUrl);
    if (parsed.hostname === "127.0.0.1") {
      parsed.hostname = "localhost";
    }
    return parsed.toString();
  } catch (_error) {
    return inputUrl;
  }
}

export function getAuthRedirectUri(pathname = "/profile") {
  if (typeof window === "undefined") {
    return pathname;
  }

  const absolute = new URL(pathname, window.location.href).toString();
  return getCanonicalAuthUrl(absolute);
}
