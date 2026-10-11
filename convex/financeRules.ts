export type LedgerEntry = { kind: "payment" | "deposit" | "refund"; amount: number };

export function summarizeLedger(estimatedCost: number, entries: LedgerEntry[]) {
  const received = entries.reduce((total, entry) => total + (entry.kind === "refund" ? -entry.amount : entry.amount), 0);
  return {
    estimatedCost,
    received,
    outstanding: Math.max(estimatedCost - received, 0),
    overpaid: Math.max(received - estimatedCost, 0),
    currency: "IDR" as const,
  };
}

export function netReceipts(entries: LedgerEntry[]) {
  return entries.reduce((total, entry) => total + (entry.kind === "refund" ? -entry.amount : entry.amount), 0);
}
