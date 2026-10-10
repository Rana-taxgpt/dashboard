import { signOut } from "@/auth";
import type { DashboardModel, Period } from "@/lib/dashboard";
import { TIME_ZONE } from "@/lib/constants";

function money(value: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function integer(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function pretty(ymd: string) {
  const [year, month, day] = ymd.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function stamp(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function ratio(numerator: number, denominator: number | null) {
  if (denominator == null || denominator === 0) return null;
  return numerator / denominator;
}

function change(current: number | null, previous: number | null) {
  if (current == null || previous == null || previous === 0) return null;
  return (current - previous) / previous;
}

function Metric({
  label,
  value,
  previous,
  better,
}: {
  label: string;
  value: string;
  previous: string | null;
  better?: "up" | "down";
}) {
  const delta = change(
    value === "—" ? null : Number(value.replace(/[^0-9.-]/g, "")),
    previous == null || previous === "—" ? null : Number(previous.replace(/[^0-9.-]/g, "")),
  );
  const improved = delta != null && better ? (better === "up" ? delta > 0 : delta < 0) : null;
  return (
    <div className="min-w-0 flex-1">
      <p className="text-xs uppercase tracking-[0.16em] text-[#6f6a62]">{label}</p>
      <p className="mt-3 font-mono text-4xl tracking-tight text-[#1b1915]">{value}</p>
      <p className={`mt-2 text-sm ${improved == null ? "text-[#6f6a62]" : improved ? "text-[#0f6b4c]" : "text-[#9f2d2d]"}`}>
        {value === "—"
          ? "Waiting on Amplitude"
          : delta == null
            ? "No previous window"
            : `${delta > 0 ? "+" : ""}${(delta * 100).toFixed(1)}% vs previous 30 days`}
      </p>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.14em] text-[#6f6a62]">{label}</p>
      <p className="mt-1 font-mono text-lg text-[#1b1915]">{value}</p>
    </div>
  );
}

function periodFacts(period: Period) {
  const cpa = ratio(period.spend, period.demos);
  const cpl = ratio(period.spend, period.leadForms);
  const cpm = period.impressions ? (period.spend / period.impressions) * 1000 : null;
  return { cpa, cpl, cpm };
}

export function Dashboard({ data, email }: { data: DashboardModel; email: string }) {
  const current = data.current;
  const previous = data.previous;
  const currency = current?.currency ?? "USD";
  const currentFacts = current ? periodFacts(current) : null;
  const previousFacts = previous ? periodFacts(previous) : null;
  const maxSpend = Math.max(...data.days.map((day) => day.spend), 1);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-8">
      <header className="flex items-start justify-between gap-6 border-b border-[#ddd6c8] pb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[#6f6a62]">TaxGPT</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Ads</h1>
          <p className="mt-2 text-sm text-[#6f6a62]">
            Meta account 984644083020099 · Pacific time
            {current ? ` · refreshed ${stamp(current.refreshedAt)}` : ""}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-[#6f6a62]">{email}</p>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/sign-in" });
            }}
          >
            <button className="mt-2 text-sm underline decoration-[#cfc6b8] underline-offset-4" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </header>

      {data.status === "unconfigured" ? (
        <section className="mt-10 max-w-xl">
          <h2 className="text-xl font-semibold">Database is not connected</h2>
          <p className="mt-3 text-[#6f6a62]">
            Add DATABASE_URL, then run the hourly refresh. Spend, demos, and CPA show up after the first successful run.
          </p>
        </section>
      ) : null}

      {data.status === "empty" ? (
        <section className="mt-10 max-w-xl">
          <h2 className="text-xl font-semibold">Waiting for the first refresh</h2>
          <p className="mt-3 text-[#6f6a62]">
            The hourly job pulls Meta spend and, once the Amplitude secret is saved, the unique Facebook demo count.
          </p>
        </section>
      ) : null}

      {current && currentFacts ? (
        <main className="mt-8 flex flex-col gap-10">
          <section>
            <p className="text-sm text-[#6f6a62]">
              Last 30 days · {pretty(current.since)} – {pretty(current.until)}
            </p>
            {current.demos == null ? (
              <p className="mt-4 border border-[#e4d3a8] bg-[#fbf6ea] px-4 py-3 text-sm text-[#6a5420]">
                Demos and CPA stay blank until the Amplitude secret is saved. Spend is already from Meta.
              </p>
            ) : null}
            <div className="mt-6 flex flex-col gap-8 border-y border-[#ddd6c8] py-6 sm:flex-row">
              <Metric
                label="Spend"
                value={money(current.spend, currency)}
                previous={previous ? money(previous.spend, currency) : null}
              />
              <Metric
                label="Demos"
                value={current.demos == null ? "—" : integer(current.demos)}
                previous={previous?.demos == null ? null : integer(previous.demos)}
                better="up"
              />
              <Metric
                label="CPA"
                value={currentFacts.cpa == null ? "—" : money(currentFacts.cpa, currency)}
                previous={previousFacts?.cpa == null ? null : money(previousFacts.cpa, currency)}
                better="down"
              />
            </div>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-[#6f6a62]">
              Demos are unique Demo Booked users whose initial source is facebook, excluding the random Calendly cohort and the email taxgpt. CPA divides Meta spend by that unique total. Daily uniques are not added together.
            </p>
          </section>

          <section className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
            <Fact label="Impressions" value={integer(current.impressions)} />
            <Fact label="Link clicks" value={integer(current.linkClicks)} />
            <Fact label="Reach" value={integer(current.reach)} />
            <Fact label="Lead forms" value={integer(current.leadForms)} />
            <Fact label="CPL" value={currentFacts.cpl == null ? "—" : money(currentFacts.cpl, currency)} />
            <Fact label="CPM" value={currentFacts.cpm == null ? "—" : money(currentFacts.cpm, currency)} />
          </section>
          <p className="-mt-6 text-sm text-[#6f6a62]">Reach is the people reached in this window. It is not a sum of daily reach.</p>

          <section>
            <h2 className="text-lg font-semibold">Daily spend</h2>
            {data.days.length ? (
              <>
                <div className="mt-4 flex h-40 items-end gap-1">
                  {data.days.map((day) => (
                    <div
                      key={day.day}
                      className="min-w-0 flex-1 bg-[#1b1915]"
                      style={{ height: `${Math.max(2, (day.spend / maxSpend) * 100)}%` }}
                      title={`${pretty(day.day)} ${money(day.spend, currency)}`}
                    />
                  ))}
                </div>
                <div className="mt-2 flex justify-between text-xs text-[#6f6a62]">
                  <span>{pretty(data.days[0].day)}</span>
                  <span>{pretty(data.days[data.days.length - 1].day)}</span>
                </div>
              </>
            ) : (
              <p className="mt-3 text-sm text-[#6f6a62]">Daily bars appear as the refresh stores each day. The totals above already cover the full window.</p>
            )}
          </section>

          <section>
            <h2 className="text-lg font-semibold">Campaign spend</h2>
            <p className="mt-1 text-sm text-[#6f6a62]">Spend only. Campaign names do not match demo sources, so there is no campaign CPA.</p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-[#ddd6c8] text-xs uppercase tracking-[0.14em] text-[#6f6a62]">
                  <tr>
                    <th className="py-2 font-medium">Campaign</th>
                    <th className="py-2 text-right font-medium">Spend</th>
                    <th className="py-2 text-right font-medium">Impressions</th>
                    <th className="py-2 text-right font-medium">Clicks</th>
                    <th className="py-2 text-right font-medium">Link clicks</th>
                    <th className="py-2 text-right font-medium">Lead forms</th>
                  </tr>
                </thead>
                <tbody>
                  {data.campaigns.map((campaign) => (
                    <tr key={campaign.campaignId} className="border-b border-[#eee7dc]">
                      <td className="max-w-[280px] truncate py-3 pr-4">{campaign.campaignName || campaign.campaignId}</td>
                      <td className="py-3 text-right font-mono">{money(campaign.spend, currency)}</td>
                      <td className="py-3 text-right font-mono">{integer(campaign.impressions)}</td>
                      <td className="py-3 text-right font-mono">{integer(campaign.clicks)}</td>
                      <td className="py-3 text-right font-mono">{integer(campaign.linkClicks)}</td>
                      <td className="py-3 text-right font-mono">{integer(campaign.leadForms)}</td>
                    </tr>
                  ))}
                  {data.campaigns.length === 0 ? (
                    <tr>
                      <td className="py-4 text-[#6f6a62]" colSpan={6}>
                        Campaign rows appear after the first daily refresh.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      ) : null}
    </div>
  );
}
