import crypto from "crypto";

/**
 * Kraken API client for fetching ledger entries and trades
 * Uses API-Key and API-Sign headers for authentication
 */

const KRAKEN_API_BASE = "https://api.kraken.com/0";

interface KrakenLedgerEntry {
  refid: string;
  time: number;
  type: string;
  subtype: string;
  aclass: string;
  asset: string;
  amount: string;
  fee: string;
  balance: string;
}

interface KrakenTrade {
  ordertxid: string;
  postxid: string;
  pair: string;
  time: number;
  type: string;
  ordertype: string;
  price: string;
  cost: string;
  fee: string;
  vol: string;
  margin: string;
  misc: string;
  posstatus?: string;
  cprice?: string;
  ccost?: string;
  cfee?: string;
  cvol?: string;
  cmargin?: string;
  net?: string;
  trades?: string[];
}

interface KrakenResponse<T> {
  error: string[];
  result?: T;
}

/**
 * Kraken API client
 */
export class KrakenClient {
  private apiKey: string;
  private apiSecret: string;

  constructor(apiKey: string, apiSecret: string) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
  }

  /**
   * Generate the API-Sign header for Kraken API requests
   */
  private generateSignature(
    path: string,
    data: Record<string, string | number>,
    nonce: number
  ): string {
    const postData = new URLSearchParams();
    postData.append("nonce", nonce.toString());

    for (const [key, value] of Object.entries(data)) {
      postData.append(key, String(value));
    }

    const postDataString = postData.toString();
    const message = path + crypto.createHash("sha256").update(postDataString).digest();

    const signature = crypto
      .createHmac("sha512", Buffer.from(this.apiSecret, "base64"))
      .update(message)
      .digest("base64");

    return signature;
  }

  /**
   * Make an authenticated request to Kraken API
   */
  private async request<T>(
    endpoint: string,
    data: Record<string, string | number> = {}
  ): Promise<T> {
    const nonce = Date.now() * 1000; // Kraken requires nonce in microseconds
    const path = `/0/private/${endpoint}`;
    const signature = this.generateSignature(path, data, nonce);

    const postData = new URLSearchParams();
    postData.append("nonce", nonce.toString());

    for (const [key, value] of Object.entries(data)) {
      postData.append(key, String(value));
    }

    try {
      const response = await fetch(`${KRAKEN_API_BASE}${path}`, {
        method: "POST",
        headers: {
          "API-Key": this.apiKey,
          "API-Sign": signature,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: postData.toString(),
      });

      const result = (await response.json()) as KrakenResponse<T>;

      if (result.error && result.error.length > 0) {
        throw new Error(`Kraken API error: ${result.error.join(", ")}`);
      }

      return result.result as T;
    } catch (error) {
      console.error(`[Kraken] Request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Get ledger entries (all transaction types)
   */
  async getLedger(
    startTime?: number,
    endTime?: number
  ): Promise<Record<string, KrakenLedgerEntry>> {
    const data: Record<string, string | number> = {
      type: "all",
    };

    if (startTime) data.start = startTime;
    if (endTime) data.end = endTime;

    return this.request<Record<string, KrakenLedgerEntry>>("Ledgers", data);
  }

  /**
   * Get trades (completed trades only)
   */
  async getTrades(
    startTime?: number,
    endTime?: number
  ): Promise<Record<string, KrakenTrade>> {
    const data: Record<string, string | number> = {};

    if (startTime) data.start = startTime;
    if (endTime) data.end = endTime;

    return this.request<Record<string, KrakenTrade>>("TradesHistory", data);
  }

  /**
   * Get account balance
   */
  async getBalance(): Promise<Record<string, string>> {
    return this.request<Record<string, string>>("Balance");
  }

  /**
   * Get all transactions (combines ledger and trades)
   */
  async getAllTransactions(
    startTime?: number,
    endTime?: number
  ): Promise<Array<{ id: string; type: string; data: KrakenLedgerEntry | KrakenTrade }>> {
    const transactions: Array<{
      id: string;
      type: string;
      data: KrakenLedgerEntry | KrakenTrade;
    }> = [];

    try {
      const ledger = await this.getLedger(startTime, endTime);
      for (const [id, entry] of Object.entries(ledger)) {
        transactions.push({
          id,
          type: "ledger",
          data: entry,
        });
      }
    } catch (error) {
      console.error("[Kraken] Failed to fetch ledger:", error);
    }

    try {
      const trades = await this.getTrades(startTime, endTime);
      for (const [id, trade] of Object.entries(trades)) {
        transactions.push({
          id,
          type: "trade",
          data: trade,
        });
      }
    } catch (error) {
      console.error("[Kraken] Failed to fetch trades:", error);
    }

    // Sort by time descending
    return transactions.sort((a, b) => {
      const timeA = (a.data as KrakenLedgerEntry).time || 0;
      const timeB = (b.data as KrakenLedgerEntry).time || 0;
      return timeB - timeA;
    });
  }
}

/**
 * Validate Kraken API credentials by attempting to fetch balance
 */
export async function validateKrakenCredentials(
  apiKey: string,
  apiSecret: string
): Promise<boolean> {
  try {
    const client = new KrakenClient(apiKey, apiSecret);
    const balance = await client.getBalance();
    return Object.keys(balance).length > 0;
  } catch (error) {
    console.error("[Kraken] Credential validation failed:", error);
    return false;
  }
}
