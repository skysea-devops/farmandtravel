// CloudFront Function (viewer-request): 301 www.<apex> -> https://<apex>.
function handler(event) {
  var request = event.request;
  var host = request.headers.host.value;
  if (host === "www.${apex}") {
    return {
      statusCode: 301,
      statusDescription: "Moved Permanently",
      headers: { location: { value: "https://${apex}" + request.uri } },
    };
  }
  return request;
}
