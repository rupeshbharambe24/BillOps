"use client";

import { useEffect, useState } from "react";

import Button from "../../components/Button";
import Card from "../../components/Card";
import Toast from "../../components/Toast";
import { useToast } from "../../components/useToast";
import { apiFetch } from "../../lib/api";
import { formatCurrency, formatTimestamp } from "../../lib/format";

export default function BalancesPage() {
  const { toast, show, dismiss } = useToast();
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const loadBalances = async (userId = "") => {
    try {
      setLoading(true);
      const url = userId ? `/balances?user_id=${encodeURIComponent(userId)}` : "/balances";
      const response = await apiFetch(url);
      setItems(response.items || []);
    } catch (error) {
      show(error.message || "Failed to load balances", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBalances();
  }, []);

  const handleSearch = () => {
    loadBalances(query.trim());
  };

  return (
    <div className="page-fade space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Balances</p>
        <h1 className="text-3xl font-semibold text-slate-900">Balances</h1>
        <p className="text-sm text-slate-600">Search by user_id or browse all balances.</p>
      </header>

      <Card className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <input
            className="w-full rounded-xl border border-white/70 bg-white/80 px-4 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Search by user_id"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Button onClick={handleSearch} disabled={loading}>
            Search
          </Button>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Loading balances...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-slate-500">No balances found.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-white/70">
            <table className="w-full text-sm">
              <thead className="bg-white/70 text-left text-xs uppercase tracking-[0.2em] text-slate-500">
                <tr>
                  <th className="px-4 py-2">User</th>
                  <th className="px-4 py-2">Balance</th>
                  <th className="px-4 py-2">Updated</th>
                </tr>
              </thead>
              <tbody className="bg-white/40">
                {items.map((row) => (
                  <tr key={row.user_id} className="border-t border-white/70">
                    <td className="px-4 py-2 font-medium text-slate-700">{row.user_id}</td>
                    <td
                      className={`px-4 py-2 ${row.balance < 0 ? "text-rose-600" : "text-slate-700"}`}
                    >
                      {formatCurrency(row.balance)}
                    </td>
                    <td className="px-4 py-2 text-slate-600">
                      {formatTimestamp(row.updated_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Toast toast={toast} onDismiss={dismiss} />
    </div>
  );
}
