import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createConnectedAccount,
  getConnectedAccountsByUserId,
  getConnectedAccountById,
  deleteConnectedAccount,
  updateAccountSyncStatus,
  transactionExists,
  createTransaction,
} from "../db";
import { encryptValue, decryptValue } from "../encryption";
import { CoinbaseClient, validateCoinbaseCredentials } from "../exchanges/coinbase";
import { KrakenClient, validateKrakenCredentials } from "../exchanges/kraken";

export const accountsRouter = router({
  /**
   * List all connected accounts for the current user
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const accounts = await getConnectedAccountsByUserId(ctx.user.id);
    return accounts.map((acc) => ({
      id: acc.id,
      exchange: acc.exchange,
      accountName: acc.accountName,
      lastSyncedAt: acc.lastSyncedAt,
      syncStatus: acc.syncStatus,
      syncError: acc.syncError,
      createdAt: acc.createdAt,
    }));
  }),

  /**
   * Connect a Coinbase account
   */
  connectCoinbase: protectedProcedure
    .input(
      z.object({
        accountName: z.string().min(1, "Account name is required"),
        accessToken: z.string().min(1, "Access token is required"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate the access token
      const isValid = await validateCoinbaseCredentials(input.accessToken);
      if (!isValid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid Coinbase API credentials",
        });
      }

      // Encrypt and store
      const encryptedKey = encryptValue(input.accessToken);
      const encryptedSecret = encryptValue(""); // Coinbase uses OAuth, no secret

      const result = await createConnectedAccount(
        ctx.user.id,
        "coinbase",
        input.accountName,
        encryptedKey,
        encryptedSecret
      );

      return {
        id: (result as any).insertId || 0,
        exchange: "coinbase",
        accountName: input.accountName,
      };
    }),

  /**
   * Connect a Kraken account
   */
  connectKraken: protectedProcedure
    .input(
      z.object({
        accountName: z.string().min(1, "Account name is required"),
        apiKey: z.string().min(1, "API Key is required"),
        apiSecret: z.string().min(1, "API Secret is required"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate the credentials
      const isValid = await validateKrakenCredentials(input.apiKey, input.apiSecret);
      if (!isValid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid Kraken API credentials",
        });
      }

      // Encrypt and store
      const encryptedKey = encryptValue(input.apiKey);
      const encryptedSecret = encryptValue(input.apiSecret);

      const result = await createConnectedAccount(
        ctx.user.id,
        "kraken",
        input.accountName,
        encryptedKey,
        encryptedSecret
      );

      return {
        id: (result as any).insertId || 0,
        exchange: "kraken",
        accountName: input.accountName,
      };
    }),

  /**
   * Disconnect an account
   */
  disconnect: protectedProcedure
    .input(z.object({ accountId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const account = await getConnectedAccountById(input.accountId);
      if (!account || account.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Account not found or unauthorized",
        });
      }

      await deleteConnectedAccount(input.accountId);
      return { success: true };
    }),

  /**
   * Sync transactions from a connected account
   */
  syncTransactions: protectedProcedure
    .input(z.object({ accountId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const account = await getConnectedAccountById(input.accountId);
      if (!account || account.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Account not found or unauthorized",
        });
      }

      try {
        await updateAccountSyncStatus(input.accountId, "syncing");

        if (account.exchange === "coinbase") {
          await syncCoinbaseTransactions(ctx.user.id, account);
        } else if (account.exchange === "kraken") {
          await syncKrakenTransactions(ctx.user.id, account);
        }

        await updateAccountSyncStatus(input.accountId, "success");
        return { success: true };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        await updateAccountSyncStatus(input.accountId, "error", errorMessage);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Sync failed: ${errorMessage}`,
        });
      }
    }),
});

/**
 * Sync Coinbase transactions
 */
async function syncCoinbaseTransactions(
  userId: number,
  account: any
) {
  const decryptedToken = decryptValue(account.encryptedApiKey);
  const client = new CoinbaseClient(decryptedToken);

  const coinbaseTransactions = await client.getAllTransactions();

  for (const tx of coinbaseTransactions) {
    const externalId = `coinbase-${tx.id}`;

    // Skip if already exists
    if (await transactionExists(userId, externalId)) {
      continue;
    }

    const nativeAmount = tx.native_amount?.amount || undefined;
    const nativeCurrency = tx.native_amount?.currency || undefined;
    const fee = tx.network?.transaction_fee?.amount || undefined;
    const feeCurrency = tx.network?.transaction_fee?.currency || undefined;

    let counterparty: string | undefined = undefined;
    if (tx.to?.email) counterparty = tx.to.email;
    else if (tx.to?.address) counterparty = tx.to.address;
    else if (tx.from?.email) counterparty = tx.from.email;
    else if (tx.from?.address) counterparty = tx.from.address;

    await createTransaction(
      userId,
      account.id,
      "coinbase",
      externalId,
      tx.type,
      tx.status,
      tx.amount.amount,
      tx.amount.currency,
      nativeAmount,
      nativeCurrency,
      fee,
      feeCurrency,
      counterparty,
      new Date(tx.created_at),
      JSON.stringify(tx)
    );
  }
}

/**
 * Sync Kraken transactions
 */
async function syncKrakenTransactions(
  userId: number,
  account: any
) {
  const decryptedKey = decryptValue(account.encryptedApiKey);
  const decryptedSecret = decryptValue(account.encryptedApiSecret);
  const client = new KrakenClient(decryptedKey, decryptedSecret);

  const krakenTransactions = await client.getAllTransactions();

  for (const item of krakenTransactions) {
    const externalId = `kraken-${item.id}`;

    // Skip if already exists
    if (await transactionExists(userId, externalId)) {
      continue;
    }

    const data = item.data as any;
    const time = new Date((data.time || Date.now() / 1000) * 1000);

    let transactionType = data.type || "unknown";
    let amount = data.amount || "0";
    let currency = data.asset || "";
    let status = "completed";

    if (item.type === "trade" && data.pair) {
      transactionType = data.type || "trade";
      amount = data.vol || "0";
      currency = data.pair || "";
    }

    await createTransaction(
      userId,
      account.id,
      "kraken",
      externalId,
      transactionType,
      status,
      amount,
      currency,
      data.cost || undefined, // For trades, this is the cost
      "USD", // Kraken typically shows costs in USD
      data.fee || undefined,
      currency,
      undefined, // Kraken doesn't provide counterparty in ledger
      time,
      JSON.stringify(data)
    );
  }
}
