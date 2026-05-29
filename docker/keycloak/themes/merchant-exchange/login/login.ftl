<#assign showUsername = !(usernameHidden?? && usernameHidden)>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${realm.displayName!'Merchant Exchange Survival'}</title>
  <link rel="icon" href="${url.resourcesPath}/img/merchant-logo.png">
  <link rel="stylesheet" href="${url.resourcesPath}/css/login.css">
</head>
<body>
  <main class="merchant-login-shell">
    <section class="merchant-login-panel">
      <div class="merchant-brand">
        <div class="merchant-logo-frame">
          <img src="${url.resourcesPath}/img/merchant-logo.png" alt="Merchant Exchange Survival emblem">
        </div>
        <div class="merchant-kicker">Guild Gatekeeper</div>
        <h1>Merchant Exchange Survival</h1>
        <p>Authenticate with Keycloak to enter the kingdom market desk.</p>
      </div>

      <#if message?has_content>
        <div class="merchant-message merchant-message-${message.type}">
          ${kcSanitize(message.summary)?no_esc}
        </div>
      </#if>

      <form id="kc-form-login" class="merchant-form" action="${url.loginAction}" method="post" onsubmit="login.disabled = true; return true;">
        <#if showUsername>
          <label for="username">
            <#if !realm.loginWithEmailAllowed>
              ${msg("username")}
            <#elseif !realm.registrationEmailAsUsername>
              ${msg("usernameOrEmail")}
            <#else>
              ${msg("email")}
            </#if>
          </label>
          <input
            id="username"
            name="username"
            value="${login.username!''}"
            type="text"
            autofocus
            autocomplete="username"
            aria-invalid="<#if messagesPerField.existsError('username','password')>true</#if>"
          >
        </#if>

        <label for="password">${msg("password")}</label>
        <input
          id="password"
          name="password"
          type="password"
          autocomplete="current-password"
          aria-invalid="<#if messagesPerField.existsError('username','password')>true</#if>"
        >

        <#if messagesPerField.existsError('username','password')>
          <div class="merchant-field-error">
            ${kcSanitize(messagesPerField.getFirstError('username','password'))?no_esc}
          </div>
        </#if>

        <div class="merchant-form-row">
          <#if realm.rememberMe && showUsername>
            <label class="merchant-check" for="rememberMe">
              <input id="rememberMe" name="rememberMe" type="checkbox" <#if login.rememberMe??>checked</#if>>
              <span>${msg("rememberMe")}</span>
            </label>
          <#else>
            <span></span>
          </#if>

          <#if realm.resetPasswordAllowed>
            <a href="${url.loginResetCredentialsUrl}">${msg("doForgotPassword")}</a>
          </#if>
        </div>

        <#if auth.selectedCredential?has_content>
          <input type="hidden" name="credentialId" value="${auth.selectedCredential}">
        </#if>

        <button id="kc-login" name="login" type="submit">Enter Market</button>
      </form>

      <div class="merchant-demo">
        <span>Demo guild access</span>
        <code>viewer/viewer</code>
        <code>trader/trader</code>
        <code>admin/admin</code>
      </div>

      <#if realm.registrationAllowed>
        <p class="merchant-register">
          ${msg("noAccount")} <a href="${url.registrationUrl}">${msg("doRegister")}</a>
        </p>
      </#if>
    </section>
  </main>
</body>
</html>
