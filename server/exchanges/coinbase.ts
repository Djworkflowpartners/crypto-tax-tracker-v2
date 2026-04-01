import crypto from "crypto";

/**
 * Coinbase API v2 client for fetching transaction history
 * Uses OAuth2 Bearer token authentication
 */

const COINBASE_API_BASE = "https://api.coinbase.com/v2";

interface CoinbaseAccount {
  id: string;
  name: string;
  primary: boolean;
  type: string;
  currency: {
    code: string;
    name: string;
  };
  balance: {
    amount: string;
    currency: string;
  };
}

interface CoinbaseTransaction {
  id: string;
  type: string;
  status: string;
  amount: {
    amount: string;
    currency: string;
  };
  native_amount: {
    amount: string;
    currency: string;
  };
  description: string | null;
  created_at: string;
  updated_at: string;
  resource: string;
  resource_path: string;
  details?: {
    title?: string;
    subtitle?: string;
  };
  to?: {
    resource: string;
    address?: string;
    email?: string;
  };
  from?: {
    resource: string;
    address?: string;
    email?: string;
  };
  network?: {
    status: string;
    transaction_fee?: {
      amount: string;
      currency: string;
    };
  };
}

interface CoinbaseListResponse<T> {
  pagination: {
    ending_before: string | null;
    starting_after: string | null;
    limit: number;
    order: string;
    previous_uri: string | null;
    next_uri: string | null;
  };
  data: T[];
}

/**
 * Coinbase API client
 */
export class CoinbaseClient {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  /**
   * Make an authenticated request to Coinbase API
   */
  private async request<T>(
    path: string,
    method: string = "GET"
  ): Promise<T> {
    const url = `${COINBASE_API_BASE}${path}`;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(
          `Coinbase API error (${response.status}): ${error}`
        );
      }

      return (await response.json()) as T;
    } catch (error) {
      console.error(`[Coinbase] Request failed for ${path}:`, error);
      throw error;
    }
  }

  /**
   * Get all accounts for the authenticated user
   */
  async getAccounts(): Promise<CoinbaseAccount[]> {
    const response = await this.request<CoinbaseListResponse<CoinbaseAccount>>(
      "/accounts"
    );
    return response.data;
  }

  /**
   * Get transactions for a specific account
   * Coinbase returns 25 results per page by default
   */
  async getAccountTransactions(
    accountId: string,
    limit: number = 100
  ): Promise<CoinbaseTransaction[]> {
    const allTransactions: CoinbaseTransaction[] = [];
    let startingAfter: string | null = null;
    let fetched = 0;

    while (fetched < limit) {
      const query = new URLSearchParams();
      query.append("limit", Math.min(100, limit - fetched).toString());
      if (startingAfter) {
        query.append("starting_after", startingAfter);
      }

      const response = await this.request<
        CoinbaseListResponse<CoinbaseTransaction>
      >(`/accounts/${accountId}/transactions?${query.toString()}`);

      allTransactions.push(...response.data);
      fetched += response.data.length;

      if (!response.pagination.next_uri || response.data.length === 0) {
        break;
      }

      // Extract starting_after from next_uri
      const nextUrl = new URL(response.pagination.next_uri, COINBASE_API_BASE);
      startingAfter = nextUrl.searchParams.get("starting_after");
      if (!startingAfter) break;
    }

    return allTransactions;
  }

  /**
   * Get all transactions across all accounts
   */
  async getAllTransactions(limit: number = 500): Promise<CoinbaseTransaction[]> {
    const accounts = await this.getAccounts();
    const allTransactions: CoinbaseTransaction[] = [];

    for (const account of accounts) {
      try {
        const transactions = await this.getAccountTransactions(
          account.id,
          limit
        );
        allTransactions.push(...transactions);
      } catch (error) {
        console.error(
          `[Coinbase] Failed to fetch transactions for account ${account.id}:`,
          error
        );
      }
    }

    // Sort by date descending
    return allTransactions.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }
}

/**
 * Validate Coinbase API credentials by attempting to fetch accounts
 */
export async function validateCoinbaseCredentials(
  accessToken: string
): Promise<boolean> {
  try {
    const client = new CoinbaseClient(accessToken);
    const accounts = await client.getAccounts();
    return accounts.length > 0;
  } catch (error) {
    console.error("[Coinbase] Credential validation failed:", error);
    return false;
  }
}
