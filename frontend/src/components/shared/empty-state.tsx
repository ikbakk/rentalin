import { Button } from "@/components/ui/button"

interface EmptyStateProps {
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-muted">
        <div className="size-6 rounded-full border-2 border-muted-foreground/30" />
      </div>
      <h3 className="mt-4 text-sm font-semibold">{title}</h3>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">{description}</p>
      {action && (
        <Button variant="default" size="sm" className="mt-6" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
