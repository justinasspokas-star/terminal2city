/* Terminal2City: track real affiliate clicks and comparison actions. */
(function () {
  "use strict";
  if (window.__t2cTrackingInstalled) return;
  window.__t2cTrackingInstalled = true;
  function send(name, data) { if (typeof window.gtag === "function") window.gtag("event", name, data); }
  function placement(a) {
    if (a.closest(".airhelp-mobile-float")) return "mobile_float";
    if (a.closest(".article-callout")) return "article_callout";
    if (a.closest(".article-cta, .hero-route-actions, .route-search-cta")) return "primary_cta";
    if (a.closest("header, nav")) return "navigation";
    return "content_link";
  }
  document.addEventListener("click", function (event) {
    var node = event.target && (event.target.nodeType === 1 ? event.target : event.target.parentElement);
    var link = node && node.closest ? node.closest("a[href]") : null;
    if (!link) return;
    var target;
    try { target = new URL(link.href, document.baseURI); } catch (error) { return; }
    if (target.protocol !== "http:" && target.protocol !== "https:") return;
    var pagePath = window.location.pathname;
    var container = link.closest("[data-route-id]");
    var routeId = container ? container.getAttribute("data-route-id") : (pagePath.split("/").pop().replace(/\.html$/, "") || "home");
    if (target.origin === window.location.origin) {
      if (target.pathname === "/" && target.hash === "#compare") {
        send("transfer_compare_click", {source_page: pagePath, route_id: routeId, link_placement: placement(link)});
      }
      return;
    }
    var provider = (link.getAttribute("data-affiliate") || "").trim();
    if (!provider && target.hostname.toLowerCase() === "airhelp.tpx.lv") provider = "AirHelp";
    if (!provider) return; // Official reference links must not be counted as affiliate referrals.
    send("affiliate_click", {
      affiliate_provider: provider.slice(0, 80), source_page: pagePath,
      route_id: routeId, link_placement: placement(link), outbound_domain: target.hostname.toLowerCase()
    });
  }, false);
  document.addEventListener("submit", function (event) {
    var form = event.target;
    if (!form || !form.matches) return;
    if (form.matches("form#compare")) {
      var airport = form.querySelector("#ap");
      send("transfer_search", {source_page: window.location.pathname, airport_code: airport ? airport.value : "unknown"});
    } else if (form.matches(".decision-form")) {
      var box = form.closest("[data-route-id]");
      send("route_planner_submit", {source_page: window.location.pathname, route_id: box ? box.getAttribute("data-route-id") : "unknown"});
    }
  }, true);
})();
