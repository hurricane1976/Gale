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
  // per-host 24h rollups the fleet-24h cards deref directly. These were
  // missing here once and zod silently stripped them off SSE pushes
  // (poll path never validated), leaving every card at "--" minutes after
  // load -- validate what the renderers dereference, or it bites.
  runs_24h_by_host: z.record(z.number().nullable()),
  cost_24h_by_host: z.record(z.number().nullable()),
  error_runs_24h_by_host: z.record(z.number()).optional(),
  last_wake_by_host: z.record(strOr).optional(),
  agents_by_host: z.record(z.array(z.string())).optional(),
});

export const wakesPayload = z.object({
  schema: z.string(),
  count: z.number(),
  runs: z.array(z.object({
    agent: z.string(),
    ts: z.string(),
    is_error: z.boolean(),
    duration_ms: numOr,
    cost_usd: numOr,
  })),
  generated_at: z.string(),
});

export const asksPayload = z.object({
  schema: z.string(),
  total_open: z.number(),
  agents: z.array(z.object({
    agent: z.string(),
    mtime: z.string(),
    open_asks: z.number(),
    headings: z.array(z.string()),
  })),
  generated_at: z.string(),
});

export const observabilityPayload = z.object({
  totals: z.object({
    cost_usd: z.number(),
    mean_cost_usd: z.number(),
    total_tokens: z.number().optional(),
    // per-agent lanes (#18 + latent lane-empty fix: zod strips undeclared
    // keys, so agents MUST be declared or the lanes render empty)
    agents: z.array(z.object({
      agent: z.string(),
      runs: z.number(),
      cost_usd: z.number(),
      mean_cost_usd: z.number().optional(),
      total_tokens: z.number(),
      last_ts: strOr.optional(),
      p50_ms: numOr.optional(),
      p95_ms: numOr.optional(),
      errors: z.number().optional(),
      tokens_24h: z.number().optional(),
      burn_tok_per_h: z.number().optional(),
    })).optional(),
  }),
  runs: z.array(z.object({
    ts: z.string(),
    agent: z.string(),
    // run-explorer + cost chart + lanes dereference these directly —
    // omitting them here strips them via zod (same bite as metrics
    // runs_24h_by_host and status os/kernel before).
    waking_count: z.number().optional(),
    model: z.string().optional(),
    model_family: z.string().optional(),
    cost_usd: z.number().optional(),
    cost_estimated: z.boolean().optional(),
    input_tokens: numOr.optional(),
    output_tokens: numOr.optional(),
    cache_read_tokens: numOr.optional(),
    duration_ms: numOr.optional(),
    measured: strOr.optional(),
    first_event_ms: numOr.optional(),
    turns: numOr.optional(),
    is_error: z.boolean().optional(),
    terminal_reason: strOr.optional(),
    host: z.string().optional(),
    source: z.string().optional(),
  })),
  count: z.number(),
  generated_at: z.string(),
  instrumented_since: z.string().optional(),
});

export const statusPayload = z.object({
  host: z.object({
    hostname: z.string(),
    // identity fields renderHostInfo writes out directly -- omitted from
    // this schema once and zod stripped them to "--" on every render
    os: strOr.optional(),
    kernel: strOr.optional(),
    arch: strOr.optional(),
    boot_time: strOr.optional(),
    cpu_count: z.number(),
    cpu_pct: z.number(),
    uptime_s: z.number(),
    reboot_required: z.boolean(),
    load: z.array(z.number()),
    mem: z.object({ pct: z.number(), used_mb: z.number(), total_mb: z.number() }),
    swap: z.object({ pct: z.number(), used_mb: z.number() }),
    disks: z.array(z.object({ pct: z.number(), used_gb: z.number(), total_gb: z.number() })),
    cpu_per_core: z.array(z.number()),
    // capacity forecast (sysmon disk-history regression); z.unknown so the
    // renderer owns the shape -- sysmon may add fields without a zod bump
    disk_forecast: z.unknown().optional(),
    // hardware telemetry (thermal/hwmon/NVMe); same renderer-owns-shape deal
    hardware: z.unknown().optional(),
  }),
  services: z.array(z.object({
    unit: z.string(),
    state: z.string(),
    since: strOr.optional(),
    sub: strOr.optional(),
    n_restarts: numOr.optional(),
    memory_bytes: numOr.optional(),
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
  // Ops-status board extras (firewalla/ollama/full_targets). Only fields the
  // renderers dereference *unconditionally* are pinned; everything else
  // passes through untouched -- renderFirewall/renderOllama/renderFullHosts
  // all guard on their own ok/reachable/health flags. z.unknown() (not
  // z.object) matters here: a bare z.object would STRIP the undeclared
  // sub-fields before they reach the renderers.
  firewalla: z.unknown().optional(),
  ollama: z.unknown().optional(),
  // kernel distress (PSI pressure, OOM count, klog tail); renderer-owned
  kernel: z.unknown().optional(),
  // hygiene (TLS cert runway, backup age); renderer-owned shape
  hygiene: z.unknown().optional(),
  // secret/config drift (sudoers change, perm issues, token age)
  drift: z.unknown().optional(),
  full_targets: z.array(z.object({
    name: z.string(),
    addr: strOr,
    platform: strOr.optional(),
    health: z.string(),
    latency_ms: numOr.optional(),
    error: strOr.optional(),
    stats: z.unknown().optional(),
  })),
  // 90-day uptime ledger (worst-daily health per target); shape owned by
  // sysmon + renderUptime
  uptime_history: z.unknown().optional(),
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
