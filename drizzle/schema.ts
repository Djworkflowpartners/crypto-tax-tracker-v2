import { decimal, int, mysqlEnum, mysqlTable, text, timestamp, varchar, index } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Connected exchange accounts (Coinbase, Kraken, etc.)
 * Stores encrypted API credentials and account metadata
 */
export const connectedAccounts = mysqlTable(
  "connected_accounts",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    exchange: mysqlEnum("exchange", ["coinbase", "kraken"]).notNull(),
    accountName: varchar("accountName", { length: 255 }).notNull(), // User-friendly name (e.g., "My Coinbase")
    encryptedApiKey: text("encryptedApiKey").notNull(), // Encrypted API key
    encryptedApiSecret: text("encryptedApiSecret").notNull(), // Encrypted API secret (for Kraken)
    lastSyncedAt: timestamp("lastSyncedAt"),
    syncStatus: mysqlEnum("syncStatus", ["pending", "syncing", "success", "error"]).default("pending").notNull(),
    syncError: text("syncError"), // Error message if sync failed
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("user_id_idx").on(table.userId),
  })
);

export type ConnectedAccount = typeof connectedAccounts.$inferSelect;
export type InsertConnectedAccount = typeof connectedAccounts.$inferInsert;

/**
 * Unified transactions table
 * Stores transactions from all connected exchanges in a normalized format
 */
export const transactions = mysqlTable(
  "transactions",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    accountId: int("accountId").notNull(), // Reference to connectedAccounts
    exchange: mysqlEnum("exchange", ["coinbase", "kraken"]).notNull(),
    externalId: varchar("externalId", { length: 255 }).notNull(), // Transaction ID from exchange (e.g., Coinbase transaction ID)
    transactionType: varchar("transactionType", { length: 100 }).notNull(), // buy, sell, send, receive, transfer, deposit, withdrawal, trade, etc.
    status: varchar("status", { length: 100 }).notNull(), // pending, completed, failed, etc.
    amount: decimal("amount", { precision: 20, scale: 8 }).notNull(), // Crypto amount
    currency: varchar("currency", { length: 10 }).notNull(), // BTC, ETH, USD, etc.
    nativeAmount: decimal("nativeAmount", { precision: 20, scale: 2 }), // Amount in fiat currency
    nativeCurrency: varchar("nativeCurrency", { length: 10 }), // USD, CAD, etc.
    fee: decimal("fee", { precision: 20, scale: 8 }), // Transaction fee
    feeCurrency: varchar("feeCurrency", { length: 10 }), // Currency of the fee
    counterparty: text("counterparty"), // Email, address, or account name of counterparty
    transactionDate: timestamp("transactionDate").notNull(), // When the transaction occurred
    rawData: text("rawData"), // JSON blob of raw exchange response for reference
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("tx_user_id_idx").on(table.userId),
    accountIdIdx: index("tx_account_id_idx").on(table.accountId),
    externalIdIdx: index("tx_external_id_idx").on(table.externalId),
    transactionDateIdx: index("tx_date_idx").on(table.transactionDate),
  })
);

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

/**
 * Transaction annotations (user-added descriptions and categories)
 * Allows users to tag transactions for accounting/bookkeeping purposes
 */
export const transactionAnnotations = mysqlTable(
  "transaction_annotations",
  {
    id: int("id").autoincrement().primaryKey(),
    transactionId: int("transactionId").notNull(),
    userId: int("userId").notNull(),
    description: text("description"), // User-provided description (e.g., "Office supplies purchase")
    category: varchar("category", { length: 100 }), // Category for accounting (e.g., "Business Expense", "Income", "Transfer", "Tax Payment")
    notes: text("notes"), // Additional notes
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    transactionIdIdx: index("ann_tx_id_idx").on(table.transactionId),
    userIdIdx: index("ann_user_id_idx").on(table.userId),
  })
);

export type TransactionAnnotation = typeof transactionAnnotations.$inferSelect;
export type InsertTransactionAnnotation = typeof transactionAnnotations.$inferInsert;