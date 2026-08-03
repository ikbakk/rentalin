import { Card, CardContent } from "@/components/ui/card"
import { StatusChip } from "@/components/shared/status-chip"
import type { InspectionResponse } from "@/lib/types"

export function InspectionCard({ inspection }: { inspection: InspectionResponse }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-2 p-4">
        <div className="flex items-center justify-between">
          <span className="font-mono text-sm font-semibold">{inspection.inspectionType}</span>
          <StatusChip status={inspection.status} />
        </div>
        {inspection.notes && <div className="text-sm text-muted-foreground border-l-2 border-muted pl-2">{inspection.notes}</div>}
        {inspection.inspectionDate && (
          <div className="font-mono text-xs text-muted-foreground">{new Date(inspection.inspectionDate).toLocaleDateString()}</div>
        )}
      </CardContent>
    </Card>
  )
}
