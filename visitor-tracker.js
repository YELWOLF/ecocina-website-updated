/**
 * Ecocina Visitor Tracker
 * ─────────────────────────────────────────────────────────────────────
 * Drop one <script> tag on every page of ecocinacom.com.
 * Uses IPinfo (free: 50k req/month) to identify the visitor's company
 * from their IP, then pushes to your existing RB2B intake webhook.
 *
 * Setup:
 *   1. Get a free token at https://ipinfo.io/signup
 *   2. Replace IPINFO_TOKEN below
 *   3. Paste the minified version at the bottom of <body> on every page
 */

(function () {
  // ── Config ──────────────────────────────────────────────────────────
  var IPINFO_TOKEN  = "YOUR_IPINFO_TOKEN";   // replace with your token
  var WEBHOOK_URL   = "https://spout-hamlet-stapling.ngrok-free.dev/webhook/rb2b-intake";
  var COOLDOWN_DAYS = 7;                     // don't re-fire for same IP within N days

  // ── Helpers ─────────────────────────────────────────────────────────
  function storageKey(ip) { return "ecocina_v_" + ip; }

  function recentlySent(ip) {
    try {
      var raw = localStorage.getItem(storageKey(ip));
      if (!raw) return false;
      var ts = parseInt(raw, 10);
      return (Date.now() - ts) < COOLDOWN_DAYS * 86400000;
    } catch (_) { return false; }
  }

  function markSent(ip) {
    try { localStorage.setItem(storageKey(ip), String(Date.now())); } catch (_) {}
  }

  function parseOrg(org) {
    // IPinfo returns "AS12345 Company Name Ltd" — strip the ASN prefix
    if (!org) return "";
    return org.replace(/^AS\d+\s+/i, "").trim();
  }

  function isBot(org) {
    var bots = ["amazon", "google", "microsoft", "cloudflare", "digitalocean",
                "linode", "ovh", "hetzner", "vultr", "fastly", "akamai"];
    var lower = (org || "").toLowerCase();
    return bots.some(function (b) { return lower.indexOf(b) !== -1; });
  }

  // ── Main ────────────────────────────────────────────────────────────
  function run() {
    var url = "https://ipinfo.io/json?token=" + IPINFO_TOKEN;
    fetch(url)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var ip      = data.ip      || "";
        var org     = parseOrg(data.org);
        var city    = data.city    || "";
        var country = data.country || "";
        var domain  = "";

        // Skip bots, datacenters, and repeat visitors
        if (!ip || isBot(org) || recentlySent(ip)) return;

        // Try to derive a domain from org name (rough heuristic)
        if (org) {
          domain = org.toLowerCase()
            .replace(/[^a-z0-9\s]/g, "")
            .trim()
            .split(/\s+/)[0] + ".com";
        }

        var payload = {
          // RB2B-compatible field names so the same n8n normalizer works
          first_name:           "Website",
          last_name:            "Visitor",
          email:                "",          // unknown at IP level
          company_name:         org,
          company_domain:       domain,
          company_industry:     "",
          title:                "",
          page_url:             window.location.href,
          // Extra fields for richer logging
          visitor_ip:           ip,
          visitor_city:         city,
          visitor_country:      country,
          source:               "ipinfo-tracker",
        };

        fetch(WEBHOOK_URL, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(payload),
          // fire-and-forget: don't block the page
          keepalive: true,
        }).catch(function () {});   // silent fail — never break the page

        markSent(ip);
      })
      .catch(function () {});   // silent fail
  }

  // Run after page is interactive (don't slow down first paint)
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    setTimeout(run, 500);
  }
})();
