import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getTransactionsByUserId,
  getTransactionsWithAnnotations,
  upsertTransactionAnnotation,
} from "../db";
import { TRPCError } from "@trpc/server";

export const transactionsRouter = router({
  /**
   * List all transactions for the current user with pagination
   */
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const transactions = await getTransactionsByUserId(
        ctx.user.id,
        input.limit,
        input.offset
      );

      return transactions.map((tx) => ({
        id: tx.id,
        exchange: tx.exchange,
        type: tx.transactionType,
        status: tx.status,
        amount: tx.amount,
        currency: tx.currency,
        nativeAmount: tx.nativeAmount,
        nativeCurrency: tx.nativeCurrency,
        fee: tx.fee,
        feeCurrency: tx.feeCurrency,
        counterparty: tx.counterparty,
        date: tx.transactionDate,
        createdAt: tx.createdAt,
      }));
    }),

  /**
   * Get all transactions with their annotations
   */
  listWithAnnotations: protectedProcedure.query(async ({ ctx }) => {
    const results = await getTransactionsWithAnnotations(ctx.user.id);

    return results.map((item) => ({
      id: item.transaction.id,
      exchange: item.transaction.exchange,
      type: item.transaction.transactionType,
      status: item.transaction.status,
      amount: item.transaction.amount,
      currency: item.transaction.currency,
      nativeAmount: item.transaction.nativeAmount,
      nativeCurrency: item.transaction.nativeCurrency,
      fee: item.transaction.fee,
      feeCurrency: item.transaction.feeCurrency,
      counterparty: item.transaction.counterparty,
      date: item.transaction.transactionDate,
      description: item.annotation?.description || "",
      category: item.annotation?.category || "",
      notes: item.annotation?.notes || "",
    }));
  }),

  /**
   * Update transaction annotation (description, category, notes)
   * BUG FIX: Properly verify transaction ownership by checking if the transaction belongs to the user
   */
  updateAnnotation: protectedProcedure
    .input(
      z.object({
        transactionId: z.number(),
        description: z.string().optional(),
        category: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify transaction belongs to user by fetching it directly
      const transactions = await getTransactionsByUserId(ctx.user.id, 1000, 0);
      const txExists = transactions.some((tx) => tx.id === input.transactionId);

      if (!txExists) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Transaction not found or unauthorized",
        });
      }

      await upsertTransactionAnnotation(
        input.transactionId,
        ctx.user.id,
        input.description,
        input.category,
        input.notes
      );

      return { success: true };
    }),
});
