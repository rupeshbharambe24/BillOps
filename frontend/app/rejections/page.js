"use client";

import { useEffect, useState } from "react";

import Button from "../../components/Button";
import Card from "../../components/Card";
import Toast from "../../components/Toast";
import { useToast } from "../../components/useToast";
import { apiFetch } from "../../lib/api";
import { formatTimestamp } from "../../lib/format";

export default function RejectionsPage() {
  const { toast, show, dismiss } = useToast();
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadRejections = async (nextPage = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(nextPage),
        limit: String(limit),
      });
      const response = await apiFetch(`/rejections?${params.toString()}`);
      setItems(response.items || []);
      setTotal(response.total || 0);
      setPage(nextPage);
    } catch (error) {
      show(error.message || "Failed to load rejections", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRejections(1);
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="page-fade space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Rejections</p>
        <h1 className="text-3xl font-semibold text-slate-900">Rejected Events</h1>
        <p className="text-sm text-slate-600">Overdraft or policy-rejected events live here.</p>
      </header>

      <Card className="space-y-4">
        {loading ? (
          <p className="text-sm text-slate-500">Loading rejections...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-slate-500">No rejected events found.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-white/70">
            <table className="w-full text-sm">
              <thead className="bg-white/70 text-left text-xs uppercase tracking-[0.2em] text-slate-500">
                <tr>
                  <th className="px-4 py-2">Created</th>
                  <th className="px-4 py-2">Event ID</th>
                  <th className="px-4 py-2">Reason</th>
                  <th className="px-4 py-2">Payload</th>
                </tr>
              </thead>
              <tbody className="bg-white/40">
                {items.map((rejection) => (
                  <tr key={rejection.id} className="border-t border-white/70 align-top">
                    <td className="px-4 py-3 text-slate-600">
                      {formatTimestamp(rejection.created_at)}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700">
                      {rejection.event_id}
                    </td>
                    <td className="px-4 py-3 text-rose-600">
                      <span className="rounded-full bg-rose-100 px-2 py-1 text-xs font-semibold uppercase tracking-[0.15em]">
                        {rejection.reason}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <details className="rounded-lg border border-white/80 bg-white/60 p-2">
                        <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                          View payload
                        </summary>
                        <pre className="mt-2 whitespace-pre-wrap text-xs text-slate-700">
                          {rejection.payload_json}
                        </pre>
                      </details>
                    </td>
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
              onClick={() => loadRejections(Math.max(1, page - 1))}
              disabled={page === 1 || loading}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              onClick={() => loadRejections(Math.min(totalPages, page + 1))}
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
