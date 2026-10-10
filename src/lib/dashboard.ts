import { ACCOUNT_ID } from "@/lib/constants";
import { db, ensureSchema } from "@/lib/db";

export type Period = {
  period: string;
  since: string;
  until: string;
  spend: number;
  impressions: number;
  clicks: number;
  linkClicks: number;
  reach: number;
  demos: number | null;
  leadForms: number;
  currency: string;
  refreshedAt: string;
};

export type DayPoint = { day: string; spend: number };

export type CampaignTotal = {
  campaignId: string;
  campaignName: string;
  spend: number;
  impressions: number;
  clicks: number;
  linkClicks: number;
  leadForms: number;
};

export type DashboardModel = {
  status: "unconfigured" | "empty" | "ready";
  current: Period | null;
  previous: Period | null;
  days: DayPoint[];
  campaigns: CampaignTotal[];
};

const empty: DashboardModel = {
  status: "empty",
  current: null,
  previous: null,
  days: [],
  campaigns: [],
};

export async function loadDashboard(): Promise<DashboardModel> {
  const sql = db();
  if (!sql) return { ...empty, status: "unconfigured" };
  await ensureSchema(sql);

  const periods = await sql<
    {
      period: string;
      since: string;
      until: string;
      spend: number;
      impressions: number;
      clicks: number;
      link_clicks: number;
      reach: number;
      demos: number | null;
      lead_forms: number;
      currency: string;
      refreshed_at: Date;
    }[]
  >`
    SELECT period, since::text AS since, until::text AS until,
      spend::float8 AS spend, impressions, clicks, link_clicks, reach, demos,
      lead_forms, currency, refreshed_at
    FROM period_snapshots
    WHERE account_id = ${ACCOUNT_ID}
  `;

  const toPeriod = (row: (typeof periods)[number]): Period => ({
    period: row.period,
    since: row.since,
    until: row.until,
    spend: row.spend,
    impressions: row.impressions,
    clicks: row.clicks,
    linkClicks: row.link_clicks,
    reach: row.reach,
    demos: row.demos,
    leadForms: row.lead_forms,
    currency: row.currency,
    refreshedAt: row.refreshed_at.toISOString(),
  });

  const current = periods.find((row) => row.period === "last_30_days");
  const previous = periods.find((row) => row.period === "previous_30_days");
  if (!current) return empty;

  const days = await sql<DayPoint[]>`
    SELECT day::text AS day, spend::float8 AS spend
    FROM account_days
    WHERE account_id = ${ACCOUNT_ID}
      AND day BETWEEN ${current.since} AND ${current.until}
    ORDER BY day
  `;
  const campaigns = await sql<
    {
      campaign_id: string;
      campaign_name: string;
      spend: number;
      impressions: number;
      clicks: number;
      link_clicks: number;
      lead_forms: number;
    }[]
  >`
    SELECT campaign_id, max(campaign_name) AS campaign_name,
      sum(spend)::float8 AS spend,
      sum(impressions)::int AS impressions,
      sum(clicks)::int AS clicks,
      sum(link_clicks)::int AS link_clicks,
      sum(lead_forms)::int AS lead_forms
    FROM campaign_days
    WHERE account_id = ${ACCOUNT_ID}
      AND day BETWEEN ${current.since} AND ${current.until}
    GROUP BY campaign_id
    ORDER BY sum(spend) DESC
    LIMIT 20
  `;

  return {
    status: "ready",
    current: toPeriod(current),
    previous: previous ? toPeriod(previous) : null,
    days,
    campaigns: campaigns.map((row) => ({
      campaignId: row.campaign_id,
      campaignName: row.campaign_name,
      spend: row.spend,
      impressions: row.impressions,
      clicks: row.clicks,
      linkClicks: row.link_clicks,
      leadForms: row.lead_forms,
    })),
  };
}
