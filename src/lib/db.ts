import postgres, { type Sql } from "postgres";

let client: Sql | null = null;

export function db() {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  if (!client) {
    client = postgres(url, {
      ssl: url.includes("localhost") ? false : "require",
      max: 1,
      prepare: false,
    });
  }
  return client;
}

export async function ensureSchema(sql: Sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS account_days (
      day date NOT NULL,
      account_id text NOT NULL,
      spend numeric(14,2) NOT NULL,
      impressions integer NOT NULL,
      clicks integer NOT NULL,
      link_clicks integer NOT NULL,
      lead_forms integer NOT NULL,
      reach integer NOT NULL,
      demos integer,
      currency text NOT NULL,
      refreshed_at timestamptz NOT NULL,
      PRIMARY KEY (day, account_id)
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS campaign_days (
      day date NOT NULL,
      account_id text NOT NULL,
      campaign_id text NOT NULL,
      campaign_name text NOT NULL,
      spend numeric(14,2) NOT NULL,
      impressions integer NOT NULL,
      clicks integer NOT NULL,
      link_clicks integer NOT NULL,
      lead_forms integer NOT NULL,
      currency text NOT NULL,
      refreshed_at timestamptz NOT NULL,
      PRIMARY KEY (day, campaign_id)
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS period_snapshots (
      period text NOT NULL,
      account_id text NOT NULL,
      since date NOT NULL,
      until date NOT NULL,
      spend numeric(14,2) NOT NULL,
      impressions integer NOT NULL,
      clicks integer NOT NULL,
      link_clicks integer NOT NULL,
      reach integer NOT NULL,
      demos integer,
      lead_forms integer NOT NULL,
      currency text NOT NULL,
      refreshed_at timestamptz NOT NULL,
      PRIMARY KEY (period, account_id)
    )
  `;
}
