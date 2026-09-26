// Uygulama hataları — HTTP katmanı bunları status koduna çevirir.
export class AppError extends Error {
  constructor(
    public status: number,
    message: string,
    public code = "app_error",
  ) {
    super(message);
  }
}
export const NotFound = (m = "Not found") => new AppError(404, m, "not_found");
export const BadRequest = (m = "Bad request") => new AppError(400, m, "bad_request");
export const Unauthorized = (m = "Unauthorized") => new AppError(401, m, "unauthorized");
export const Forbidden = (m = "Forbidden") => new AppError(403, m, "forbidden");
