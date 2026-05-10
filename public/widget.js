(function () {
  var script = document.currentScript || (function () {
    var scripts = document.getElementsByTagName("script");
    return scripts[scripts.length - 1];
  })();

  var businessId = script.getAttribute("data-business-id");
  if (!businessId) return;

  var origin = script.src.replace(/\/widget\.js.*$/, "");

  function buildWidget(data) {
    var container = document.getElementById("starloop-widget");
    if (!container) return;

    var reviews = data.reviews || [];
    if (reviews.length === 0) { container.style.display = "none"; return; }

    var css = [
      ".sl-widget { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }",
      ".sl-title { font-size: 16px; font-weight: 700; color: #111827; margin-bottom: 12px; }",
      ".sl-grid { display: flex; flex-wrap: wrap; gap: 12px; }",
      ".sl-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; flex: 1 1 220px; max-width: 320px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }",
      ".sl-stars { color: #f59e0b; font-size: 14px; margin-bottom: 6px; }",
      ".sl-text { font-size: 13px; color: #374151; line-height: 1.5; margin-bottom: 8px; }",
      ".sl-author { font-size: 12px; color: #9ca3af; font-weight: 600; }",
      ".sl-footer { margin-top: 12px; font-size: 11px; color: #9ca3af; text-align: right; }",
      ".sl-footer a { color: #2563eb; text-decoration: none; font-weight: 600; }",
    ].join(" ");

    var styleEl = document.createElement("style");
    styleEl.textContent = css;
    document.head.appendChild(styleEl);

    var html = '<div class="sl-widget">';
    html += '<div class="sl-title">\u2b50 What customers say about ' + escHtml(data.businessName) + "</div>";
    html += '<div class="sl-grid">';

    reviews.forEach(function (r) {
      html += '<div class="sl-card">';
      html += '<div class="sl-stars">\u2605\u2605\u2605\u2605\u2605</div>';
      if (r.content) {
        var snippet = r.content.length > 160 ? r.content.slice(0, 157) + "\u2026" : r.content;
        html += '<div class="sl-text">\u201c' + escHtml(snippet) + "\u201d</div>";
      }
      html += '<div class="sl-author">' + escHtml(r.reviewerName || "Anonymous") + "</div>";
      html += "</div>";
    });

    html += "</div>";

    var pageUrl = data.slug ? origin + "/r/" + data.slug : origin;
    html += '<div class="sl-footer">Powered by <a href="' + origin + '" target="_blank" rel="noopener">StarLoop</a>';
    if (data.slug) { html += ' &middot; <a href="' + pageUrl + '" target="_blank" rel="noopener">See all reviews</a>'; }
    html += "</div>";
    html += "</div>";

    container.innerHTML = html;
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  fetch(origin + "/api/widget/" + businessId)
    .then(function (r) { return r.json(); })
    .then(buildWidget)
    .catch(function () {});
})();
