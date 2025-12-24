"use client";

import { useEffect, useState } from "react";

import Button from "../../components/Button";
import Card from "../../components/Card";
import Toast from "../../components/Toast";
import { useToast } from "../../components/useToast";
import { apiFetch } from "../../lib/api";
import { formatCurrency, formatTimestamp } from "../../lib/format";

export default function EventsPage() {
  const { toast, show, dismiss } = useToast();
  const [items, setItems] = useState([]);
  const [userId, setUserId] = useState("");
  const [type, setType] = useState("all");
  const [sort, setSort] = useState("desc");
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadEvents = async (nextPage = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(nextPage),
        limit: String(limit),
        sort,
      });
      if (userId.trim()) {
        params.set("user_id", userId.trim());
      }
      if (type !== "all") {
        params.set("type", type);
      }
      const response = await apiFetch(`/events?${params.toString()}`);
      setItems(response.items || []);
      setTotal(response.total || 0);
      setPage(nextPage);
    } catch (error) {
      show(error.message || "Failed to load events", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents(1);
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="page-fade space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Ledger</p>
        <h1 className="text-3xl font-semibold text-slate-900">Events Ledger</h1>
        <p className="text-sm text-slate-600">Browse the event ledger and filter by user or type.</p>
      </header>

      <Card className="space-y-4">
        <div className="grid gap-3 md:grid-cols-4">
          <input
            className="rounded-xl border border-white/70 bg-white/80 px-4 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Filter by user_id"
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
          />
          <select
            className="rounded-xl border border-white/70 bg-white/80 px-4 py-2 text-sm text-slate-700"
            value={type}
            onChange={(event) => setType(event.target.value)}
          >
            <option value="all">All types</option>
            <option value="CREDIT">Credit</option>
            <option value="DEBIT">Debit</option>
          </select>
          <select
            className="rounded-xl border border-white/70 bg-white/80 px-4 py-2 text-sm text-slate-700"
            value={sort}
            onChange={(event) => setSort(event.target.value)}
          >
            <option value="desc">Newest first</option>
            <option value="asc">Oldest first</option>
          </select>
          <Button onClick={() => loadEvents(1)} disabled={loading}>
            Apply Filters
          </Button>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Loading events...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-slate-500">No events found.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-white/70">
            <table className="w-full text-sm">
              <thead className="bg-white/70 text-left text-xs uppercase tracking-[0.2em] text-slate-500">
                <tr>
                  <th className="px-4 py-2">Timestamp</th>
                  <th className="px-4 py-2">Event ID</th>
                  <th className="px-4 py-2">User</th>
                  <th className="px-4 py-2">Type</th>
                  <th className="px-4 py-2">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white/40">
                {items.map((event) => (
                  <tr key={event.event_id} className="border-t border-white/70">
                    <td className="px-4 py-2 text-slate-600">
                      {formatTimestamp(event.timestamp)}
                    </td>
                    <td className="px-4 py-2 font-medium text-slate-700">{event.event_id}</td>
                    <td className="px-4 py-2 text-slate-700">{event.user_id}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold uppercase tracking-[0.15em] ${
                          event.type === "CREDIT"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {event.type}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-slate-700">{formatCurrency(event.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => loadEvents(Math.max(1, page - 1))}
              disabled={page === 1 || loading}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              onClick={() => loadEvents(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages || loading}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      <Toast toast={toast} onDismiss={dismiss} />
    </div>
  );
}
