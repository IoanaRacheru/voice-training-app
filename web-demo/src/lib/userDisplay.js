function isNonEmpty(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function normalize(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

export function getUserDisplayName(user, { fallbackToEmail = true } = {}) {
  const firstName = normalize(user?.first_name);
  const lastName = normalize(user?.last_name);
  const fullName = normalize(user?.full_name || user?.name);

  if (isNonEmpty(firstName) && isNonEmpty(lastName)) {
    return `${firstName} ${lastName}`;
  }

  if (isNonEmpty(fullName)) {
    return fullName;
  }

  if (isNonEmpty(user?.username) && String(user.username).includes(" ") && !String(user.username).includes("@")) {
    return normalize(user.username);
  }

  if (fallbackToEmail && isNonEmpty(user?.email)) {
    return normalize(user.email);
  }

  return "User";
}

export function getUserContactEmail(user) {
  return isNonEmpty(user?.email) ? normalize(user.email) : "No email available";
}
