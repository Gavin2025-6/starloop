(function () {
  "use strict";

  var script = document.currentScript || (function () {
    var scripts = document.getElementsByTagName("script");
    return scripts[scripts.length - 1];
  })();

  var slug = script.getAttribute("data-business");
  if (!slug) {
    console.warn("[ServiceStar Widget] Missing data-business attribute on script tag");
    return;
  }

  var baseUrl = (script.src || "").replace(/\/widget\.js.*$/, "");
  if (!baseUrl) baseUrl = "https://service-star-production.up.railway.app";

  var container = document.createElement("div");
  container.id = "servicestar-widget-container";
  container.style.cssText = [
    "position:fixed",
    "bottom:0",
    "right:0",
    "width:400px",
    "height:600px",
    "z-index:2147483647",
    "pointer-events:none",
    "overflow:hidden",
  ].join(";");

  var iframe = document.createElement("iframe");
  iframe.src = baseUrl + "/widget/" + encodeURIComponent(slug);
  iframe.style.cssText = [
    "width:100%",
    "height:100%",
    "border:none",
    "background:transparent",
    "pointer-events:all",
  ].join(";");
  iframe.allow = "clipboard-write";
  iframe.title = "ServiceStar Booking Widget";

  container.appendChild(iframe);
  document.body.appendChild(container);
})();
