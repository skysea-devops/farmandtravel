// Placeholder Lambda package. Real code is built from backend/ and deployed by CI
// (update-function-code). Terraform manages the function but ignores code changes.
export const handler = async () => ({
  statusCode: 200,
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ ok: true, stub: true, message: "placeholder — deploy real code via CI" }),
});
