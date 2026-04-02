import { eq, desc, and } from "drizzle-orm";
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { InsertUser, users, connectedAccounts, transactions, transactionAnnotations } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      // This "Pool" is what connects Vercel to your VPS IP address
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
      });
      _db = drizzle(pool);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    // NEW CORRECT CODE:
  await db.insert(users).values(values).onConflictDoUpdate({
    target: users.openId,
    set: updateSet,
  });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Connected Accounts
 */
export async function createConnectedAccount(
  userId: number,
  exchange: "coinbase" | "kraken",
  accountName: string,
  encryptedApiKey: string,
  encryptedApiSecret: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(connectedAccounts).values({
    userId,
    exchange,
    accountName,
    encryptedApiKey,
    encryptedApiSecret,
  });

  return result;
}

export async function getConnectedAccountsByUserId(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(connectedAccounts)
    .where(eq(connectedAccounts.userId, userId));
}

export async function getConnectedAccountById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(connectedAccounts)
    .where(eq(connectedAccounts.id, id))
    .limit(1);

  return result[0];
}

export async function deleteConnectedAccount(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(connectedAccounts).where(eq(connectedAccounts.id, id));
}

export async function updateAccountSyncStatus(
  id: number,
  status: "pending" | "syncing" | "success" | "error",
  error?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: Record<string, unknown> = {
    syncStatus: status,
    lastSyncedAt: new Date(),
  };

  if (error) {
    updateData.syncError = error;
  }

  await db
    .update(connectedAccounts)
    .set(updateData)
    .where(eq(connectedAccounts.id, id));
}

/**
 * Transactions
 */
export async function createTransaction(
  userId: number,
  accountId: number,
  exchange: "coinbase" | "kraken",
  externalId: string,
  transactionType: string,
  status: string,
  amount: string,
  currency: string,
  nativeAmount?: string,
  nativeCurrency?: string,
  fee?: string,
  feeCurrency?: string,
  counterparty?: string,
  transactionDate?: Date,
  rawData?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(transactions).values({
    userId,
    accountId,
    exchange,
    externalId,
    transactionType,
    status,
    amount,
    currency,
    nativeAmount,
    nativeCurrency,
    fee,
    feeCurrency,
    counterparty,
    transactionDate: transactionDate || new Date(),
    rawData,
  });
}

export async function getTransactionsByUserId(
  userId: number,
  limit: number = 1000,
  offset: number = 0
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(transactions)
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.transactionDate))
    .limit(limit)
    .offset(offset);
}

export async function getTransactionWithAnnotation(transactionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const tx = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, transactionId))
    .limit(1);

  if (!tx[0]) return null;

  const annotation = await db
    .select()
    .from(transactionAnnotations)
    .where(eq(transactionAnnotations.transactionId, transactionId))
    .limit(1);

  return {
    transaction: tx[0],
    annotation: annotation[0] || null,
  };
}

/**
 * Transaction Annotations
 */
export async function upsertTransactionAnnotation(
  transactionId: number,
  userId: number,
  description?: string,
  category?: string,
  notes?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(transactionAnnotations)
    .where(eq(transactionAnnotations.transactionId, transactionId))
    .limit(1);

  if (existing[0]) {
    await db
      .update(transactionAnnotations)
      .set({ description, category, notes })
      .where(eq(transactionAnnotations.transactionId, transactionId));
  } else {
    await db.insert(transactionAnnotations).values({
      transactionId,
      userId,
      description,
      category,
      notes,
    });
  }
}

export async function getTransactionsWithAnnotations(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const txs = await db
    .select()
    .from(transactions)
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.transactionDate));

  const annotationMap = new Map();
  const annotations = await db
    .select()
    .from(transactionAnnotations)
    .where(eq(transactionAnnotations.userId, userId));

  for (const ann of annotations) {
    annotationMap.set(ann.transactionId, ann);
  }

  return txs.map((tx) => ({
    transaction: tx,
    annotation: annotationMap.get(tx.id) || null,
  }));
}

/**
 * Check if transaction already exists (by externalId)
 */
export async function transactionExists(
  userId: number,
  externalId: string
): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select({ id: transactions.id })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.externalId, externalId)
      )
    )
    .limit(1);

  return result.length > 0;
}
