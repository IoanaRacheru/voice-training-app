<!DOCTYPE html>
<html lang="${(locale.currentLanguageTag)!'en'}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>Sign in · Voice Studio</title>
  <style>
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 14px;
      color: #111111;
      min-height: 100vh;
      background-color: #f2f1ee;
      /* Same grain texture as index.css */
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140' viewBox='0 0 140 140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.82' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='.075'/%3E%3C/svg%3E");
    }

    /* ── Page shell ── */
    .auth-page {
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 28px;
    }

    /* ── Card ── */
    .auth-card {
      position: relative;
      width: min(440px, calc(100vw - 32px));
      background: #ffffff;
      border: 1px solid #111111;
      border-radius: 2px;
      padding: 34px;
      display: flex;
      flex-direction: column;
      gap: 15px;
      box-shadow: 0 24px 70px rgba(17, 17, 17, 0.11);
    }

    /* Brand strip tab above the card */
    .auth-card::before {
      content: "StillCisTho";
      position: absolute;
      left: 22px;
      top: -16px;
      background: #111111;
      color: #ffffff;
      padding: 5px 9px;
      font-family: Impact, "Arial Black", sans-serif;
      font-size: 13px;
      line-height: 1;
      transform: skew(-8deg);
    }

    /* ── Brand icon (VS mark) ── */
    .brand-icon {
      margin: 0 auto 5px;
      width: 78px;
      height: 58px;
      background: #111111;
      color: #111111;
      display: grid;
      place-items: center;
      font-size: 38px;
      box-shadow: 7px 7px 0 #d6d3ce;
    }

    .duck-mark {
      display: inline-grid;
      min-width: 2.15em;
      min-height: 1.45em;
      place-items: center;
      border: 2px solid currentColor;
      background: currentColor;
      color: inherit;
      font-family: Impact, "Arial Black", "Franklin Gothic Heavy", sans-serif;
      font-size: 0.7em;
      line-height: 1;
    }

    .duck-mark::before {
      content: "VS";
      color: #ffffff;
      display: inline-block;
      transform: skew(-8deg);
    }

    /* ── Typography ── */
    .auth-card h1 {
      color: #111111;
      font-family: Impact, "Arial Black", sans-serif;
      font-size: clamp(42px, 11vw, 66px);
      line-height: 0.9;
      text-transform: uppercase;
      letter-spacing: 0;
    }

    .auth-card .subtitle {
      color: #555555;
      line-height: 1.55;
    }

    /* ── Inputs ── */
    input[type="text"],
    input[type="email"],
    input[type="password"] {
      width: 100%;
      background: #ffffff;
      color: #111111;
      border: 1px solid #c8c4bd;
      border-radius: 2px;
      padding: 13px 14px;
      outline: none;
      font: inherit;
      font-size: 15px;
      transition: border-color 160ms ease, box-shadow 160ms ease;
    }

    input::placeholder {
      color: #66615d;
    }

    input:focus {
      border-color: #e50914;
      box-shadow: 0 0 0 3px rgba(229, 9, 20, 0.16);
    }

    /* ── Submit button ── */
    .primary-btn {
      width: 100%;
      border: 1px solid #111111;
      color: #ffffff;
      padding: 14px 18px;
      border-radius: 2px;
      font: inherit;
      font-weight: 900;
      font-size: 13px;
      text-transform: uppercase;
      background: #111111;
      margin-top: 8px;
      cursor: pointer;
      transition: background-color 160ms ease, transform 160ms ease;
    }

    .primary-btn:hover {
      background: #e50914;
      transform: translateY(-1px);
    }

    .primary-btn:active {
      transform: translateY(0);
    }

    /* ── Error banner ── */
    .auth-error {
      background: #fff1f1;
      border: 2px solid #e50914;
      color: #a00008;
      padding: 12px;
      border-radius: 2px;
      font-weight: 700;
    }

    /* ── Links row ── */
    .auth-switch {
      font-size: 14px;
      color: #555555;
    }

    .auth-switch a {
      color: #e50914;
      font-weight: 900;
      text-transform: uppercase;
      text-decoration: none;
      transition: color 160ms ease;
    }

    .auth-switch a:hover {
      color: #111111;
    }

    ::selection {
      background: #e50914;
      color: #ffffff;
    }
  </style>
</head>
<body>
  <div class="auth-page">
    <form class="auth-card" action="${url.loginAction}" method="post">

      <div class="brand-icon">
        <span class="duck-mark"></span>
      </div>

      <h1>Welcome back</h1>
      <p class="subtitle">Sign in to continue your voice training practice.</p>

      <#if message?has_content && message.type == "error">
        <div class="auth-error">${message.summary}</div>
      </#if>

      <#if usernameHidden?? && usernameHidden>
        <input type="hidden" id="username" name="username" value="${(login.username!'')}" />
        <input
          type="password"
          id="password"
          name="password"
          placeholder="Password"
          autocomplete="current-password"
          autofocus
          required
        />
      <#else>
        <input
          type="email"
          id="username"
          name="username"
          value="${(login.username!'')}"
          placeholder="Email"
          autocomplete="email"
          autofocus
          required
        />
        <input
          type="password"
          id="password"
          name="password"
          placeholder="Password"
          autocomplete="current-password"
          required
        />
      </#if>

      <input type="hidden" id="id-hidden-input" name="credentialId" />

      <button class="primary-btn" type="submit" name="login">
        Sign in
      </button>

      <#if realm.resetPasswordAllowed>
        <p class="auth-switch">
          <a href="${url.loginResetCredentialsUrl}">Forgot password?</a>
        </p>
      </#if>

      <#if realm.registrationAllowed>
        <p class="auth-switch">
          Don't have an account?
          <a href="${url.registrationUrl}">Create one</a>
        </p>
      </#if>

    </form>
  </div>
</body>
</html>
