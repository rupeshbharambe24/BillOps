"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import Button from "../components/Button";
import Card from "../components/Card";
import Toast from "../components/Toast";
import { useToast } from "../components/useToast";
import { apiFetch } from "../lib/api";
import { formatCurrency } from "../lib/format";
import { buildSampleJson } from "../lib/sample";

export default function DashboardPage() {
  const router = useRouter();
  const { toast, show, dismiss } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBalance: 0,
    events24h: 0,
    duplicates24h: 0,
    rejections24h: 0,
  });

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setLoading(true);
        const [balances, events, rejections, duplicates] = await Promise.all([
          apiFetch("/balances"),
          apiFetch("/events?since_hours=24&limit=1"),
          apiFetch("/rejections?since_hours=24&limit=1"),
          apiFetch(
            "/rejections?since_hours=24&limit=1&include_duplicates=true&reason=duplicate_event_id"
          ),
        ]);
        if (!active) {
          return;
        }
        const totalBalance = balances.items.reduce((sum, row) => sum + row.balance, 0);
        setStats({
          totalUsers: balances.items.length,
          totalBalance,
          events24h: events.total,
          duplicates24h: duplicates.total,
          rejections24h: rejections.total,
        });
      } catch (error) {
        if (active) {
          show(error.message || "Failed to load dashboard metrics", "error");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [show]);

  const kpis = useMemo(
    () => [
      {
        label: "Total Users with Balances",
        value: loading ? "--" : stats.totalUsers,
      },
      {
        label: "Current Total Balance Sum",
        value: loading ? "--" : formatCurrency(stats.totalBalance),
      },
      {
        label: "Events Processed (last 24h)",
        value: loading ? "--" : stats.events24h,
      },
      {
        label: "Duplicates Detected (last 24h)",
        value: loading ? "--" : stats.duplicates24h,
      },
      {
        label: "Rejections (last 24h)",
        value: loading ? "--" : stats.rejections24h,
      },
    ],
    [loading, stats]
  );

  const handleSample = () => {
    const payload = buildSampleJson();
    localStorage.setItem("sampleEvents", payload);
    router.push("/ingest");
  };

  return (
    <div className="page-fade space-y-10">
      <section className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
          System Overview
        </p>
        <h1 className="text-3xl font-semibold text-slate-900 md:text-4xl">
          Billing Event Processing System
        </h1>
        <p className="max-w-2xl text-base text-slate-600">
          Track user balances across multiple event sources. Idempotent ingestion, late arrival
          tolerance, and overdraft protection keep the ledger reliable.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        {kpis.map((kpi, index) => (
          <Card
            key={kpi.label}
            className="animate-fade-up flex flex-col gap-2"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{kpi.label}</p>
            <p className="text-2xl font-semibold text-slate-900">{kpi.value}</p>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 md:grid-cols-[2fr_1fr]">
        <Card className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">How it works</h2>
          <ul className="space-y-2 text-sm text-slate-600">
            <li>Deduplicate by event_id before mutating balances.</li>
            <li>Out-of-order safe via event ledger + idempotent writes.</li>
            <li>Overdraft protection blocks balances below -$10,000.</li>
          </ul>
        </Card>
        <Card className="flex flex-col items-start justify-between gap-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Try sample input</h3>
            <p className="text-sm text-slate-600">
              Load curated events and run them through the ingestion pipeline.
            </p>
          </div>
          <Button onClick={handleSample}>Load Sample into Ingest</Button>
        </Card>
      </section>
      <Toast toast={toast} onDismiss={dismiss} />
    </div>
  );
}
