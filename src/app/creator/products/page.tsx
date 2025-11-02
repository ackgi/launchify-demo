// src/app/creator/products/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { createBrowserClient } from "@/lib/supabase/client";
import { Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/app/components/ui/Button";
import { Card, CardContent } from "@/app/components/ui/Card";
import Badge from "@/app/components/ui/Badge";

type ProductStatus = "draft" | "preview" | "public" | "deprecated" | "disabled";
type ProductVisibility = "catalog" | "unlisted" | "invited" | "internal";

type ProductRow = {
  id: string;
  name: string | null;
  category: string | null;
  status: ProductStatus;
  visibility: ProductVisibility;
  thumbnail_url: string | null;
  service_endpoint_url: string | null;
  created_at: string | null;
};

export default function CreatorProductsPage() {
  const router = useRouter();
  const { getToken, isLoaded } = useAuth();

  const [supabase, setSupabase] = useState<any>(null);
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const statusBadge = useMemo(
    () =>
      ({
        draft: { label: "Draft", variant: "neutral" as const },
        preview: { label: "Preview", variant: "warning" as const },
        public: { label: "Public", variant: "success" as const },
        deprecated: { label: "Deprecated", variant: "info" as const },
        disabled: { label: "Disabled", variant: "error" as const },
      } as const),
    []
  );

  // Supabase client
  useEffect(() => {
    if (!isLoaded) return;
    (async () => {
      const token = await getToken({ template: "supabase" }).catch(() => null);
      setSupabase(createBrowserClient(token ?? undefined));
    })();
  }, [isLoaded, getToken]);

  // Fetch products
  useEffect(() => {
    if (!supabase) return;
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("api_products")
          .select(
            "id, name, category, status, visibility, thumbnail_url, service_endpoint_url, created_at"
          )
          .order("created_at", { ascending: false });
        if (error) throw error;
        if (mounted) setRows(data ?? []);
      } catch (err) {
        console.error("❌ fetch products failed:", err);
        if (mounted) setRows([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  // Delete row
  const handleDelete = async (id: string, name?: string | null) => {
    if (!supabase) return;
    const ok = confirm(`Delete product "${name ?? "(untitled)"}"?`);
    if (!ok) return;

    const snapshot = rows;
    setDeletingId(id);
    setRows((prev) => prev.filter((x) => x.id !== id));

    try {
      const { error } = await supabase.from("api_products").delete().eq("id", id);
      if (error) {
        console.error("❌ delete product:", error);
        alert("Failed to delete product.");
        setRows(snapshot); // rollback
      }
    } catch (e) {
      console.error("🔥 delete exception:", e);
      alert("Unexpected error while deleting product.");
      setRows(snapshot);
    } finally {
      setDeletingId(null);
    }
  };

  // Filter by search
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((r) => {
      const hay = `${r.name ?? ""} ${r.category ?? ""} ${r.status ?? ""} ${r.visibility ?? ""}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [rows, q]);

  // ====== UI ======
  if (loading) {
    return <div className="text-center py-16 text-gray-500">Loading products…</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your Products</h1>
          <p className="text-gray-600">Manage your API product listings</p>
        </div>
        <Button onClick={() => router.push("/creator/products/new")} size="sm">
          <Plus size={16} className="mr-2" /> New Product
        </Button>
      </div>

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

      {/* Empty state */}
      {filtered.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="py-20 text-center text-gray-600">
            <div className="text-lg font-medium mb-2">No Products Yet</div>
            <div>Create products to start publishing your APIs.</div>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-600 border-b border-gray-200">
                    <th className="py-4 px-6">Product</th>
                    <th className="py-4 px-6">Category</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6">Visibility</th>
                    <th className="py-4 px-6">Endpoint</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-6 font-medium text-gray-900 flex items-center gap-3">
                        {p.thumbnail_url ? (
                          <img
                            src={p.thumbnail_url}
                            alt={p.name ?? ""}
                            className="h-10 w-10 rounded object-cover border"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded bg-gray-100 border" />
                        )}
                        {p.name ?? "—"}
                      </td>
                      <td className="py-4 px-6">{p.category ?? "—"}</td>
                      <td className="py-4 px-6">
                        <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm">
                          {statusBadge[p.status]?.label ?? "—"}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <Badge variant="info">{p.visibility ?? "—"}</Badge>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-700">
                        {p.service_endpoint_url
                          ? new URL(p.service_endpoint_url).host
                          : "—"}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/creator/products/${p.id}/edit`)}
                          >
                            <Edit size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDelete(p.id, p.name)}
                            disabled={deletingId === p.id}
                          >
                            {deletingId === p.id ? (
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}
