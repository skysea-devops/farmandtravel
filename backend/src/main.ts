// AWS Lambda handler (API Gateway HTTP API v2).
import { handle } from "hono/aws-lambda";
import { createApp } from "./app.js";

export const handler = handle(createApp());
