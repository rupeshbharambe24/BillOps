"use client";

import { useEffect, useMemo, useState } from "react";

import Button from "../../components/Button";
import Card from "../../components/Card";
import Toast from "../../components/Toast";
import { useToast } from "../../components/useToast";
import { apiFetch } from "../../lib/api";
import { formatCurrency } from "../../lib/format";
import { buildSampleJson } from "../../lib/sample";

export default function IngestPage() {
  const { toast, show, dismiss } = useToast();
  const [input, setInput] = useState(buildSampleJson());
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("sampleEvents");
    if (stored) {
      setInput(stored);
      localStorage.removeItem("sampleEvents");
    }
  }, []);

  const balanceRows = useMemo(() => {
    if (!result?.balances) {
      return [];
    }
    return Object.entries(result.balances).sort(([a], [b]) => a.localeCompare(b));
  }, [result]);

  const handleSubmit = async () => {
    let payload;
    try {
      payload = JSON.parse(input);
    } catch (error) {
      show("Invalid JSON. Please fix the payload.", "error");
      return;
    }

    if (!Array.isArray(payload)) {
      show("Input must be a JSON array of events.", "error");
      return;
    }

    const invalid = payload.some(
      (event) =>
        !event.event_id ||
        !event.timestamp ||
        !event.user_id ||
        event.amount === undefined ||
        !event.type
    );

    if (invalid) {
      show("Each event must include event_id, timestamp, user_id, amount, and type.", "error");
      return;
    }

    try {
      setLoading(true);
      const response = await apiFetch("/events/ingest", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setResult(response);
      show("Events ingested successfully.", "success");
    } catch (error) {
      show(error.message || "Ingestion failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-fade space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Ingest</p>
        <h1 className="text-3xl font-semibold text-slate-900">Ingest Events</h1>
        <p className="text-sm text-slate-600">
          Paste a JSON array of events. The API will deduplicate and apply balance updates
          atomically.
        </p>
      </header>

      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700">Payload</p>
          <Button
            variant="secondary"
            onClick={() => setInput(buildSampleJson())}
            disabled={loading}
          >
            Load Fresh Sample
          </Button>
        </div>
        <textarea
          className="mono h-64 w-full rounded-xl border border-white/70 bg-white/80 p-4 text-xs text-slate-700 shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-500"
          value={input}
          onChange={(event) => setInput(event.target.value)}
        />
        <div className="flex justify-end">
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Processing..." : "Ingest Events"}
          </Button>
        </div>
      </Card>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Results</h2>
          {result ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Processed</p>
                  <p className="text-2xl font-semibold text-slate-900">
                    {result.processed_count}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Duplicates</p>
                  <p className="text-2xl font-semibold text-slate-900">
                    {result.duplicate_count}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Rejected</p>
                  <p className="text-2xl font-semibold text-slate-900">
                    {result.rejected_count}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-700">Balances snapshot</p>
                {balanceRows.length === 0 ? (
                  <p className="text-sm text-slate-500">No balances updated yet.</p>
                ) : (
                  <div className="mt-3 overflow-hidden rounded-xl border border-white/70">
                    <table className="w-full text-sm">
                      <thead className="bg-white/70 text-left text-xs uppercase tracking-[0.2em] text-slate-500">
                        <tr>
                          <th className="px-4 py-2">User</th>
                          <th className="px-4 py-2">Balance</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white/40">
                        {balanceRows.map(([userId, balance]) => (
                          <tr key={userId} className="border-t border-white/70">
                            <td className="px-4 py-2 font-medium text-slate-700">{userId}</td>
                            <td
                              className={`px-4 py-2 ${balance < 0 ? "text-rose-600" : "text-slate-700"}`}
                            >
                              {formatCurrency(balance)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Run an ingestion to see results.</p>
          )}
        </Card>
        <Card className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Rejected events</h2>
          {result?.rejected_events?.length ? (
            <ul className="space-y-3 text-sm text-slate-600">
              {result.rejected_events.map((item) => (
                <li key={item.event_id} className="rounded-xl border border-white/70 bg-white/60 p-3">
                  <p className="font-medium text-slate-700">{item.event_id}</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-rose-600">{item.reason}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">No rejected events to show.</p>
          )}
        </Card>
      </section>

      <Toast toast={toast} onDismiss={dismiss} />
    </div>
  );
}
