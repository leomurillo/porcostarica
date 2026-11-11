// Paste the public Measurement ID from the production GA4 web stream here.
const gaMeasurementId = "";
if (/^G-[A-Z0-9]+$/.test(gaMeasurementId) && location.hostname === "porcostarica.com") {
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag("js", new Date());
  window.gtag("config", gaMeasurementId, {
    page_location: location.origin + location.pathname,
    allow_google_signals: false,
    allow_ad_personalization_signals: false
  });
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://www.googletagmanager.com/gtag/js?id=" + gaMeasurementId;
  document.head.append(script);
}
