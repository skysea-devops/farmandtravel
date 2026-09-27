// CloudFront Function (viewer-request): 301 www.<apex> -> https://<apex> (any domain).
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
  return request;
}
