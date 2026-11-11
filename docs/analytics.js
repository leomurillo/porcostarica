if (location.hostname === "porcostarica.com") {
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  // Configure the published tag before it can send its initial page view.
  window.gtag("set", {
    page_location: location.origin + location.pathname,
    page_referrer: document.referrer ? new URL(document.referrer).origin : "",
    allow_google_signals: false,
    allow_ad_personalization_signals: false
  });
  window.gtag("js", new Date());
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://www.googletagmanager.com/gtm.js?id=GTM-NXG6LJ6T";
  document.head.append(script);
}
