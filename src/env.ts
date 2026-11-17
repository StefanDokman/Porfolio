import type { ChatGuard } from "./guard";

export interface Env {
  ASSETS: Fetcher;
  CHAT_GUARD: DurableObjectNamespace<ChatGuard>;

  // Secret. Without it the chat stays hidden.
  ANTHROPIC_API_KEY?: string;
  // Only for local development against scripts/mock-anthropic.mjs.
  ANTHROPIC_BASE_URL?: string;

  CHAT_ENABLED?: string;
  CHAT_MODEL?: string;
  MONTHLY_BUDGET_USD?: string;
  DAILY_BUDGET_USD?: string;
  IP_PER_MINUTE?: string;
  IP_PER_DAY?: string;
}

export interface Limits {
  monthlyUsd: number;
  dailyUsd: number;
  ipPerMinute: number;
  ipPerDay: number;
}

function num(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return value !== undefined && value !== "" && Number.isFinite(n) && n >= 0 ? n : fallback;
}

export function limitsFrom(env: Env): Limits {
  return {
    monthlyUsd: num(env.MONTHLY_BUDGET_USD, 5),
    dailyUsd: num(env.DAILY_BUDGET_USD, 0.16),
    ipPerMinute: num(env.IP_PER_MINUTE, 6),
    ipPerDay: num(env.IP_PER_DAY, 40),
  };
}

export function chatEnabled(env: Env): boolean {
  return Boolean(env.ANTHROPIC_API_KEY) && env.CHAT_ENABLED !== "false";
}
