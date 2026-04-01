import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getTransactionsWithAnnotations } from "../db";

/**
 * Convert transactions to CSV format
 */
function transactionsToCSV(
  transactions: Array<{
    id: number;
    exchange: string;
    type: string;
    status: string;
    amount: string;
    currency: string;
    nativeAmount: string | null;
    nativeCurrency: string | null;
    fee: string | null;
    feeCurrency: string | null;
    counterparty: string | null;
    date: Date;
    description: string;
    category: string;
    notes: string;
  }>
): string {
  // CSV headers
  const headers = [
    "Date",
    "Exchange",
    "Type",
    "Status",
    "Amount",
    "Currency",
    "Native Amount",
    "Native Currency",
    "Fee",
    "Fee Currency",
    "Counterparty",
    "Category",
    "Description",
    "Notes",
  ];

  // Escape CSV values
  const escapeCsvValue = (value: any): string => {
    if (value === null || value === undefined) return "";
    const stringValue = String(value);
    if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  // Build CSV content
  const rows = [headers.join(",")];

  for (const tx of transactions) {
    const row = [
      escapeCsvValue(new Date(tx.date).toISOString().split("T")[0]),
      escapeCsvValue(tx.exchange),
      escapeCsvValue(tx.type),
      escapeCsvValue(tx.status),
      escapeCsvValue(tx.amount),
      escapeCsvValue(tx.currency),
      escapeCsvValue(tx.nativeAmount),
      escapeCsvValue(tx.nativeCurrency),
      escapeCsvValue(tx.fee),
      escapeCsvValue(tx.feeCurrency),
      escapeCsvValue(tx.counterparty),
      escapeCsvValue(tx.category),
      escapeCsvValue(tx.description),
      escapeCsvValue(tx.notes),
    ];
    rows.push(row.join(","));
  }

  return rows.join("\n");
}

export const exportRouter = router({
  /**
   * Export all transactions to CSV
   */
  toCSV: protectedProcedure
    .input(z.object({ includeEmpty: z.boolean().optional() }))
    .query(async ({ ctx, input }) => {
      const results = await getTransactionsWithAnnotations(ctx.user.id);

      const transactions = results.map((item) => ({
        id: item.transaction.id,
        exchange: item.transaction.exchange,
        type: item.transaction.transactionType,
        status: item.transaction.status,
        amount: String(item.transaction.amount),
        currency: item.transaction.currency,
        nativeAmount: item.transaction.nativeAmount ? String(item.transaction.nativeAmount) : null,
        nativeCurrency: item.transaction.nativeCurrency,
        fee: item.transaction.fee ? String(item.transaction.fee) : null,
        feeCurrency: item.transaction.feeCurrency,
        counterparty: item.transaction.counterparty,
        date: item.transaction.transactionDate,
        description: item.annotation?.description || "",
        category: item.annotation?.category || "",
        notes: item.annotation?.notes || "",
      }));

      const csv = transactionsToCSV(transactions);
      const filename = `transactions-${new Date().toISOString().split("T")[0]}.csv`;

      return {
        csv,
        filename,
        count: transactions.length,
      };
    }),

  /**
   * Export transactions by date range to CSV
   */
  toCSVByDateRange: protectedProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const results = await getTransactionsWithAnnotations(ctx.user.id);

      const startTime = new Date(input.startDate).getTime();
      const endTime = new Date(input.endDate).getTime();

      const filtered = results.filter((item) => {
        const txTime = new Date(item.transaction.transactionDate).getTime();
        return txTime >= startTime && txTime <= endTime;
      });

      const transactions = filtered.map((item) => ({
        id: item.transaction.id,
        exchange: item.transaction.exchange,
        type: item.transaction.transactionType,
        status: item.transaction.status,
        amount: String(item.transaction.amount),
        currency: item.transaction.currency,
        nativeAmount: item.transaction.nativeAmount ? String(item.transaction.nativeAmount) : null,
        nativeCurrency: item.transaction.nativeCurrency,
        fee: item.transaction.fee ? String(item.transaction.fee) : null,
        feeCurrency: item.transaction.feeCurrency,
        counterparty: item.transaction.counterparty,
        date: item.transaction.transactionDate,
        description: item.annotation?.description || "",
        category: item.annotation?.category || "",
        notes: item.annotation?.notes || "",
      }));

      const csv = transactionsToCSV(transactions);
      const filename = `transactions-${input.startDate}-to-${input.endDate}.csv`;

      return {
        csv,
        filename,
        count: transactions.length,
      };
    }),

  /**
   * Export transactions by category to CSV
   */
  toCSVByCategory: protectedProcedure
    .input(z.object({ category: z.string() }))
    .query(async ({ ctx, input }) => {
      const results = await getTransactionsWithAnnotations(ctx.user.id);

      const filtered = results.filter(
        (item) => item.annotation?.category === input.category
      );

      const transactions = filtered.map((item) => ({
        id: item.transaction.id,
        exchange: item.transaction.exchange,
        type: item.transaction.transactionType,
        status: item.transaction.status,
        amount: String(item.transaction.amount),
        currency: item.transaction.currency,
        nativeAmount: item.transaction.nativeAmount ? String(item.transaction.nativeAmount) : null,
        nativeCurrency: item.transaction.nativeCurrency,
        fee: item.transaction.fee ? String(item.transaction.fee) : null,
        feeCurrency: item.transaction.feeCurrency,
        counterparty: item.transaction.counterparty,
        date: item.transaction.transactionDate,
        description: item.annotation?.description || "",
        category: item.annotation?.category || "",
        notes: item.annotation?.notes || "",
      }));

      const csv = transactionsToCSV(transactions);
      const filename = `transactions-${input.category}.csv`;

      return {
        csv,
        filename,
        count: transactions.length,
      };
    }),
});
