// src/app/creator/plans/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import { createBrowserClient } from "@/lib/supabase/client";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/app/components/ui/Button";
import { Card, CardContent } from "@/app/components/ui/Card";

type PlanRow = {
  id: string;
  plan_name: string | null;
  product_id: string | null;
  unit_price: number | null;
  monthly_quota: number | null;
  status: string | null;
  created_by: string | null;
  created_at: string | null;
};

export default function PlansIndexPage() {
  const router = useRouter();
  const { getToken, isLoaded } = useAuth();
  const { user } = useUser();

  const [supabase, setSupabase] = useState<any>(null);
  const [rows, setRows] = useState<PlanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Supabase クライアント生成（Clerk JWT付き）
  useEffect(() => {
    if (!isLoaded) return;
    (async () => {
      const token = await getToken({ template: "supabase" }).catch(() => null);
      setSupabase(createBrowserClient(token ?? undefined));
    })();
  }, [isLoaded, getToken]);

  // 一覧取得
  useEffect(() => {
    if (!supabase || !user?.id) return;
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("api_plans")
          .select(
            [
              "id",
              "plan_name",
              "product_id",
              "unit_price",
              "monthly_quota",
              "status",
              "created_by",
              "created_at",
            ].join(",")
          )
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (mounted) setRows(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("❌ fetch plans failed:", err);
        if (mounted) setRows([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [supabase, user?.id]);

  // 行削除
  const handleDelete = async (p: PlanRow) => {
    if (!supabase) return;
    const ok = confirm(`Delete plan "${p.plan_name ?? "(untitled)"}"?`);
    if (!ok) return;

    const snapshot = rows;
    setDeletingId(p.id);
    setRows((prev) => prev.filter((x) => x.id !== p.id));

    try {
      const { error } = await supabase.from("api_plans").delete().eq("id", p.id);
      if (error) {
        console.error("❌ delete plan:", error);
        alert("Failed to delete plan.");
        setRows(snapshot); // rollback
      }
    } catch (e) {
      console.error("🔥 delete exception:", e);
      alert("Unexpected error while deleting plan.");
      setRows(snapshot);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return <div className="text-center py-16 text-gray-500">Loading plans…</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your Plans</h1>
          <p className="text-gray-600">Manage pricing and quotas</p>
        </div>
        <Button onClick={() => router.push("/creator/plans/new")} size="sm">
          <Plus size={16} className="mr-2" /> New Plan
        </Button>
      </div>

      {/* Empty state */}
      {rows.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="py-20 text-center text-gray-600">
            <div className="text-lg font-medium mb-2">No Plans Yet</div>
            <div>Create plans to start selling your API.</div>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-600 border-b border-gray-200">
                    <th className="py-4 px-6">Plan</th>
                    <th className="py-4 px-6">Product</th>
                    <th className="py-4 px-6">Unit Price</th>
                    <th className="py-4 px-6">Monthly Quota</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => (
                    <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-6 font-medium text-gray-900">
                        {p.plan_name ?? "—"}
                        {/* 👇 内部IDの表示削除（完全非表示） */}
                      </td>
                      {/* product_idも内部IDなので表示しない */}
                      <td className="py-4 px-6">—</td>
                      <td className="py-4 px-6">
                        {p.unit_price != null
                          ? `$${p.unit_price.toFixed(2)}/unit`
                          : "—"}
                      </td>
                      <td className="py-4 px-6">
                        {p.monthly_quota != null
                          ? p.monthly_quota.toLocaleString()
                          : "—"}
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm">
                          {p.status ?? "—"}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/creator/plans/${p.id}/edit`)}
                          >
                            <Edit size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDelete(p)}
                            disabled={deletingId === p.id}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
