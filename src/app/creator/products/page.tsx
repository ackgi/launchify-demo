// src/app/creator/products/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/app/components/ui/Card";
import { Button } from "@/app/components/ui/Button";
import Badge from "@/app/components/ui/Badge";

import { useAuth } from "@clerk/nextjs";
import { createBrowserClient } from "@/lib/supabase/client";

// ---------- Types ----------
type ProductStatus = "draft" | "preview" | "public" | "deprecated" | "disabled";
type ProductVisibility = "catalog" | "unlisted" | "invited" | "internal";

interface ProductRow {
  id: string;
  name: string;
  description: string | null;
  slug: string | null;
  category: string | null;
  status: ProductStatus;
  visibility: ProductVisibility;
  thumbnail_url: string | null;
  service_endpoint_url: string | null;
  rate_limit_per_min: number | null;
  created_at: string;
  updated_at: string;
}

// ---------- Component ----------
export default function CreatorProductsPage() {
  const router = useRouter();
  const { getToken } = useAuth();

  const [rows, setRows] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [q, setQ] = useState("");

  const statusBadge = useMemo(
    () =>
      ({
        draft: { label: "draft", variant: "neutral" as const },
        preview: { label: "preview", variant: "warning" as const },
        public: { label: "public", variant: "success" as const },
        deprecated: { label: "deprecated", variant: "info" as const },
        disabled: { label: "disabled", variant: "error" as const },
      } as const),
    []
  );

  // ====== Fetch ======
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setDbError(null);
      try {
        const token = await getToken({ template: "supabase" });
        const supabase = createBrowserClient(token);

        const { data, error } = await supabase
          .from("api_products")
          .select(
            "id,name,description,slug,category,status,visibility,thumbnail_url,service_endpoint_url,rate_limit_per_min,created_at,updated_at"
          )
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (cancelled) return;

        setRows((data ?? []) as ProductRow[]);
      } catch (e: any) {
        if (!cancelled) setDbError(e?.message ?? "Failed to load products");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [getToken]);

  // ====== Delete ======
  const handleDelete = async (id: string) => {
    const ok = window.confirm("Delete this product? This cannot be undone.");
    if (!ok) return;

    setDeletingId(id);
    setDbError(null);
    try {
      const token = await getToken({ template: "supabase" });
      const supabase = createBrowserClient(token);

      const { error } = await supabase.from("api_products").delete().eq("id", id);
      if (error) throw error;

      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch (e: any) {
      setDbError(e?.message ?? "Failed to delete product");
    } finally {
      setDeletingId(null);
    }
  };

  // ====== Derived ======
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((r) => {
      const hay = `${r.name} ${r.category ?? ""} ${r.status} ${r.visibility}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [rows, q]);

  // ====== UI ======
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Your API Products</h1>
          <p className="text-gray-600 mt-1">Manage your products and their settings</p>
        </div>

        <Button
          variant="primary"
          aria-label="Create new product"
          title="Create new product"
          onClick={() => router.push("/creator/products/new")}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Product
        </Button>
      </div>

      {/* Error banner */}
      {dbError && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4 text-red-700">{dbError}</CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="flex items-center gap-3">
        <label htmlFor="productSearch" className="sr-only">
          Search products
        </label>
        <input
          id="productSearch"
          name="search"
          type="search"
          placeholder="Search products…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full max-w-md border border-gray-300 rounded-lg px-3 py-2"
        />
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Products</h2>
            <span className="text-sm text-gray-500">
              {filtered.length} item{filtered.length === 1 ? "" : "s"}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-600">
              <Loader2 className="animate-spin mr-2" />
              Loading…
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-gray-600">No products found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Visibility
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Endpoint
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {filtered.map((r) => (
                    <tr key={r.id}>
                      {/* Product */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {r.thumbnail_url ? (
                            <img
                              src={r.thumbnail_url}
                              alt=""
                              className="h-10 w-10 rounded object-cover border"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded bg-gray-100 border" />
                          )}
                          <div>
                            <div className="font-medium text-gray-900">{r.name}</div>
                            {/* 👇 slugリンクや内部URL表示を完全削除 */}
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <Badge variant={statusBadge[r.status].variant}>
                          {statusBadge[r.status].label}
                        </Badge>
                      </td>

                      {/* Visibility */}
                      <td className="px-6 py-4">
                        <Badge variant="info">{r.visibility}</Badge>
                      </td>

                      {/* Endpoint */}
                      <td className="px-6 py-4">
                        {r.service_endpoint_url ? (
                          <span className="text-gray-700 text-sm">
                            {new URL(r.service_endpoint_url).host}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            aria-label={`Edit ${r.name}`}
                            title={`Edit ${r.name}`}
                            onClick={() => router.push(`/creator/products/${r.id}/edit`)}
                          >
                            <Pencil size={16} />
                          </Button>

                          <Button
                            size="sm"
                            variant="danger"
                            aria-label={`Delete ${r.name}`}
                            title={`Delete ${r.name}`}
                            onClick={() => handleDelete(r.id)}
                            disabled={deletingId === r.id}
                          >
                            {deletingId === r.id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
