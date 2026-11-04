/* Terminal2City: record genuine affiliate outbound clicks only. */
(function () {
  "use strict";
  document.addEventListener("click", function (event) {
    var element = event.target && (event.target.nodeType === 1 ? event.target : event.target.parentElement);
    var link = element && element.closest ? element.closest("a[href]") : null;
    if (!link) return;
    var target;
    try { target = new URL(link.href, document.baseURI); } catch (error) { return; }
    if (target.protocol !== "https:" && target.protocol !== "http:") return;
    var provider = (link.getAttribute("data-affiliate") || "").trim();
    if (!provider && target.hostname.toLowerCase() === "airhelp.tpx.lv") provider = "AirHelp";
    if (!provider || typeof window.gtag !== "function") return;
    var placement = link.closest(".airhelp-mobile-float") ? "mobile_float"
      : link.closest(".article-callout") ? "article_callout" : "content_link";
    var pagePath = window.location.pathname;
    var route = link.closest("[data-route-id]");
    var routeId = route ? route.getAttribute("data-route-id") : (pagePath.split("/").pop().replace(".html", "") || "home");
    window.gtag("event", "affiliate_click", {
      affiliate_provider: provider.slice(0, 80),
      source_page: pagePath,
      route_id: routeId,
      link_placement: placement,
      outbound_domain: target.hostname.toLowerCase()
    });
  }, false);
})();
