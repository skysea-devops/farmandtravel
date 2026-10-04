// CloudFront Function (viewer-request):
//  1) 301 www.<apex> -> https://<apex> (any domain).
//  2) English market (reconnectwithsoil.com): serve index.en.html for page requests so
//     social scrapers (which don't run JS) get English <title>/Open-Graph meta. Only
//     extensionless URIs (the SPA's "/" and client routes) are rewritten; real assets
//     (…​.js/.css/.svg/…) pass through untouched.
function handler(event) {
  var request = event.request;
  var host = request.headers.host.value;
  if (host.indexOf("www.") === 0) {
    var apex = host.substring(4);
    return {
      statusCode: 301,
      statusDescription: "Moved Permanently",
      headers: { location: { value: "https://" + apex + request.uri } },
    };
  }
  if (host === "reconnectwithsoil.com") {
    var uri = request.uri;
    var lastSeg = uri.substring(uri.lastIndexOf("/") + 1);
    if (lastSeg.indexOf(".") === -1) request.uri = "/index.en.html";
  }
  return request;
}
