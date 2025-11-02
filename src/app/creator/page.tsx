//src\app\creator\page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import { Plus, Code, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/app/components/ui/Card";
import Badge from "@/app/components/ui/Badge";
import { Button } from "@/app/components/ui/Button";
import { VerificationBadge } from "@/app/components/common/VerificationBadge";
import { createBrowserClient } from "@/lib/supabase/client";

/* ------------------------------------------------
 * Types (DB columns準拠)
 * ---------------------------------------------- */
type ProductRow = {
  id: string;
  name: string | null;
  description: string | null;
  status: string | null;
  created_by: string | null;
  thumbnail_url?: string | null;
};

type PlanRow = {
  id: string;
  plan_name: string | null;
  product_id: string | null;
  unit_price: number | null;
  monthly_quota: number | null;
  status: string | null;
  created_by?: string | null;
};

type GroupRow = {
  id: string;
  plan_id: string | null;
  group_name: string;
  description: string | null;
  status: string | null;
  created_at: string;
  created_by?: string | null;
};

export default function CreatorDashboard() {
  const router = useRouter();
  const { getToken, isLoaded } = useAuth();
  const { user } = useUser();

  const [supabase, setSupabase] = useState<any>(null);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  /* ------------------------------------------------
   * ① Clerk JWT → Supabaseクライアント生成
   * ------------------------------------------------ */
  useEffect(() => {
    if (!isLoaded) return;
    (async () => {
      const token = await getToken({ template: "supabase" }).catch(() => null);
      setSupabase(createBrowserClient(token ?? undefined));
    })();
  }, [isLoaded, getToken]);

  /* ------------------------------------------------
   * ② データ取得（RLS反映済みの一覧）
   * ------------------------------------------------ */
  useEffect(() => {
    if (!supabase || !user?.id) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setErrorMsg(null);

      /* ---------- Products ---------- */
      setLoadingProducts(true);
      try {
        const { data, error } = await supabase
          .from("api_products")
          .select("id, name, description, status, created_by, thumbnail_url, created_at")
          .order("created_at", { ascending: false });
        if (!cancelled) {
          if (error) setErrorMsg((prev) => prev ?? "Failed to load products.");
          setProducts(data ?? []);
        }
      } finally {
        if (!cancelled) setLoadingProducts(false);
      }

      /* ---------- Plans ---------- */
      setLoadingPlans(true);
      try {
        const { data, error } = await supabase
          .from("api_plans")
          .select(
            "id, plan_name, product_id, unit_price, monthly_quota, status, created_by, created_at"
          )
          .order("created_at", { ascending: false });
        if (!cancelled) {
          if (error) setErrorMsg((prev) => prev ?? "Failed to load plans.");
          setPlans(data ?? []);
        }
      } finally {
        if (!cancelled) setLoadingPlans(false);
      }

      /* ---------- Groups ---------- */
      setLoadingGroups(true);
      try {
        const { data, error } = await supabase
          .from("api_endpoint_groups")
          .select("id, plan_id, group_name, description, status, created_at, created_by")
          .order("created_at", { ascending: false });
        if (!cancelled) {
          if (error) setErrorMsg((prev) => prev ?? "Failed to load groups.");
          setGroups(data ?? []);
        }
      } finally {
        if (!cancelled) setLoadingGroups(false);
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [supabase, user?.id]);

  /* ------------------------------------------------
   * ③ 削除処理
   * ------------------------------------------------ */
  const handleDeleteGroup = async (group: GroupRow) => {
    const ok = confirm(`Delete group "${group.group_name}"?`);
    if (!ok || !supabase) return;

    const snapshot = groups;
    setGroups((prev) => prev.filter((g) => g.id !== group.id));

    const { error } = await supabase.from("api_endpoint_groups").delete().eq("id", group.id);

    if (error) {
      setGroups(snapshot);
      setErrorMsg("Failed to delete group.");
    }
  };

  /* ------------------------------------------------
   * Helpers
   * ------------------------------------------------ */
  const plansById = useMemo(() => {
    const m = new Map<string, PlanRow>();
    plans.forEach((p) => p && m.set(p.id, p));
    return m;
  }, [plans]);

  const productsById = useMemo(() => {
    const m = new Map<string, ProductRow>();
    products.forEach((p) => p && m.set(p.id, p));
    return m;
  }, [products]);

  const formatPrice = (price: number | null | undefined) =>
    !price || price === 0 ? "Free" : `$${price}/unit`;

  const busy = loading || loadingGroups || loadingPlans || loadingProducts;

  /* ------------------------------------------------
   * ④ UI
   * ------------------------------------------------ */
  return (
    <div className="space-y-8" aria-busy={busy}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Creator Dashboard</h1>
          <p className="text-lg text-gray-600">Manage your products, plans, and endpoint groups.</p>
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-md bg-red-50 text-red-700 px-4 py-3 text-sm">{errorMsg}</div>
      )}

      {/* Products */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Your Products</h2>
            <p className="text-sm text-gray-600">Manage your API products</p>
          </div>
          <Button onClick={() => router.push("/creator/products/new")} size="sm">
            <Plus size={16} className="mr-2" /> New Product
          </Button>
        </CardHeader>
        <CardContent>
          {loadingProducts ? (
            <p className="text-gray-500 px-4 py-8">Loading products…</p>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <Code className="w-8 h-8 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Products Yet</h3>
              <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                Create your first API product to start monetizing your services.
              </p>
              <Button onClick={() => router.push("/creator/products/new")}>
                <Plus size={20} className="mr-2" /> Create Product
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4">Product</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-right py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.thumbnail_url || "/placeholder.png"}
                            alt={p.name || "thumbnail"}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {p.name ?? "(untitled)"}
                              {/* 👇 userID表示削除（完全非表示） */}
                            </h3>
                            {p.description && (
                              <p className="text-sm text-gray-500 truncate max-w-xs">
                                {p.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant={p.status === "public" ? "success" : "neutral"}>
                          {p.status ?? "—"}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/creator/products/${p.id}/edit`)}
                        >
                          <Edit size={16} />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 size={16} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plans */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Your Plans</h2>
            <p className="text-sm text-gray-600">Manage pricing and quotas</p>
          </div>
          <Button onClick={() => router.push("/creator/plans/new")} size="sm">
            <Plus size={16} className="mr-2" /> New Plan
          </Button>
        </CardHeader>
        <CardContent>
          {loadingPlans ? (
            <p className="text-gray-500 px-4 py-8">Loading plans…</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4">Plan</th>
                    <th className="text-left py-3 px-4">Product</th>
                    <th className="text-left py-3 px-4">Unit Price</th>
                    <th className="text-left py-3 px-4">Monthly Quota</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-right py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map((pl) => {
                    const prod = pl.product_id ? productsById.get(pl.product_id) : undefined;
                    return (
                      <tr key={pl.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4 font-medium text-gray-900">
                          {pl.plan_name ?? "(untitled)"}
                          {/* 👇 userID表示削除（完全非表示） */}
                        </td>
                        <td className="py-4 px-4">{prod?.name ?? "—"}</td>
                        <td className="py-4 px-4">{formatPrice(pl.unit_price)}</td>
                        <td className="py-4 px-4">{pl.monthly_quota ?? "—"}</td>
                        <td className="py-4 px-4">
                          <Badge variant={pl.status === "active" ? "success" : "neutral"}>
                            {pl.status ?? "—"}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/creator/plans/${pl.id}/edit`)}
                          >
                            <Edit size={16} />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                            <Trash2 size={16} />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Groups */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Your Endpoint Groups</h2>
            <p className="text-sm text-gray-600">Organize your API endpoints</p>
          </div>
          <Button onClick={() => router.push("/creator/groups/new")} size="sm">
            <Plus size={16} className="mr-2" /> New Group
          </Button>
        </CardHeader>
        <CardContent>
          {loadingGroups ? (
            <p className="text-gray-500 px-4 py-8">Loading groups…</p>
          ) : groups.length === 0 ? (
            <div className="text-center py-12">
              <Code className="w-8 h-8 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Groups Found</h3>
              <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                Create your first group to organize API endpoints.
              </p>
              <Button onClick={() => router.push("/creator/groups/new")}>
                <Plus size={20} className="mr-2" /> Create Group
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4">Group</th>
                    <th className="text-left py-3 px-4">Product</th>
                    <th className="text-left py-3 px-4">Plan</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-right py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((g) => {
                    const pl = g.plan_id ? plansById.get(g.plan_id) : undefined;
                    const prod = pl?.product_id ? productsById.get(pl.product_id) : undefined;
                    return (
                      <tr key={g.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4 font-medium text-gray-900">
                          {g.group_name ?? "(untitled)"}
                        </td>
                        <td className="py-4 px-4">{prod?.name ?? "—"}</td>
                        <td className="py-4 px-4">
                          {pl ? <Badge variant="info">{pl.plan_name ?? "—"}</Badge> : "—"}
                        </td>
                        <td className="py-4 px-4">
                          <VerificationBadge
                            status={(g.status as any) || "success"}
                            lastChecked={new Date(g.created_at).toISOString()}
                          />
                        </td>
                        <td className="py-4 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/creator/groups/${g.id}/edit`)}
                          >
                            <Edit size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteGroup(g)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
