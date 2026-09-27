import { query } from "../../shared/db/pool.js";

export type NotificationType =
  | "connection_request"
  | "connection_accepted"
  | "message"
  | "review";

// Best-effort: never let a notification failure break the triggering action.
export async function notify(
  userId: string,
  actorId: string,
  type: NotificationType,
  data: Record<string, unknown> = {},
): Promise<void> {
  try {
    await query(
      "INSERT INTO notifications (user_id, actor_id, type, data) VALUES ($1,$2,$3,$4)",
      [userId, actorId, type, data],
    );
  } catch {
    /* ignore */
  }
}
