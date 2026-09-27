/* GALE — payload schemas (ROADMAP #9). Zod v4 tripwire: validate only the
   fields a page dereferences *unconditionally* (no `||` / `??` guard upstream),
   so a genuinely broken feed fails loudly while a valid feed always passes.
   `z.object` ignores unknown keys, which is exactly how these feeds have
   always been passed through to the renderers. */
import { z } from "zod";

const numOr = z.union([z.number(), z.null()]);
const strOr = z.union([z.string(), z.null()]);

export const metricsPayload = z.object({
  days: z.array(z.string()),
  per_agent_24h: z.array(z.object({
    agent: z.string(),
    runs_24h: z.number(),
    cost_24h: numOr,
    error_runs_24h: z.number(),
    last_wake: strOr,
    daily_wakings_14d: z.array(z.number()),
    daily_cost_14d: z.array(z.number()),
    total_wakings_14d: z.number(),
  })),
  fleet_status: z.record(z.string(), z.object({
    listener: z.string(),
    state: z.string(),
    code: z.number(),
  })),
  generated_at: z.string(),
  daily_wakings_by_host: z.record(z.array(z.number())),
  daily_cost_by_host: z.record(z.array(z.number())),
});

export const observabilityPayload = z.object({
  totals: z.object({
    cost_usd: z.number(),
    mean_cost_usd: z.number(),
    total_tokens: z.number().optional(),
  }),
  runs: z.array(z.object({
    ts: z.string(),
    agent: z.string(),
  })),
  count: z.number(),
  generated_at: z.string(),
  instrumented_since: z.string().optional(),
});

export const statusPayload = z.object({
  host: z.object({
    hostname: z.string(),
    cpu_count: z.number(),
    cpu_pct: z.number(),
    uptime_s: z.number(),
    reboot_required: z.boolean(),
    load: z.array(z.number()),
    mem: z.object({ pct: z.number(), used_mb: z.number(), total_mb: z.number() }),
    swap: z.object({ pct: z.number(), used_mb: z.number() }),
    disks: z.array(z.object({ pct: z.number(), used_gb: z.number(), total_gb: z.number() })),
    cpu_per_core: z.array(z.number()),
  }),
  services: z.array(z.object({
    unit: z.string(),
    state: z.string(),
    since: strOr.optional(),
  })),
  targets: z.array(z.object({
    name: z.string(),
    kind: z.string(),
    addr: z.string(),
    health: z.string(),
  })),
  security: z.object({
    ufw_active: z.boolean().optional(),
  }),
  network: z.object({
    interfaces: z.array(z.object({
      name: z.string(),
      ip: strOr,
      rx_mbps: z.number(),
      tx_mbps: z.number(),
      rx_total_gb: z.number(),
      tx_total_gb: z.number(),
    })),
    listening_ports: z.array(z.object({
      port: z.union([z.number(), z.string()]),
      proc: strOr,
      label: z.string().optional(),
      addrs: z.array(z.string()),
    })),
    tailscale: z.unknown().optional(),
  }),
  generated_at: z.string().optional(),
});

export function validate(payload, schema) {
  const res = schema.safeParse(payload);
  if (res.data !== undefined) return res.data;
  const first = res.error?.issues?.[0];
  const msg = first
    ? `${first.path.join(".") || "?"}: ${first.message}`
    : "unparseable payload";
  throw new Error(`payload: ${msg}`);
}
