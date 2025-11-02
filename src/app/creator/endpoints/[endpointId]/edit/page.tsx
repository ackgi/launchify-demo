// src/app/creator/endpoints/[endpointId]/edit/page.tsx
import { supabaseAdmin } from "@/lib/supabase/admin";
import EndpointForm from "../../new/EndpointForm";
import { Card, CardContent, CardHeader } from "@/app/components/ui/Card";

export default async function EditEndpointPage({
  params,
}: { params: { endpointId: string } }) {
  const endpointId = params.endpointId;

  const [{ data: endpoint, error: endpointError }, { data: plans }, { data: groups }] =
    await Promise.all([
      supabaseAdmin.from("api_endpoints").select("*").eq("id", endpointId).single(),
      supabaseAdmin.from("api_plans").select("*"),
      supabaseAdmin.from("api_endpoint_groups").select("*"),
    ]);

  if (endpointError || !endpoint) {
    console.error(endpointError);
    return <div className="p-8 text-red-500 text-center">Endpoint not found</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Edit Endpoint</h2>
        </CardHeader>
        <CardContent>
          <EndpointForm
            presetGroupId={endpoint.group_id ?? ""}
            plans={plans ?? []}
            availableGroups={groups ?? []}
            initialData={endpoint}
          />
        </CardContent>
      </Card>
    </div>
  );
}
