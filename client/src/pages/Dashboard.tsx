import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, RefreshCw, Trash2 } from "lucide-react";
import ConnectAccountModal from "@/components/ConnectAccountModal";
import TransactionsTable from "@/components/TransactionsTable";
import ExportPanel from "@/components/ExportPanel";

export default function Dashboard() {
  const { user } = useAuth();
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedExchange, setSelectedExchange] = useState<"coinbase" | "kraken" | null>(null);

  // Queries
  const accountsQuery = trpc.accounts.list.useQuery();
  const transactionsQuery = trpc.transactions.listWithAnnotations.useQuery();

  // Mutations
  const syncMutation = trpc.accounts.syncTransactions.useMutation({
    onSuccess: () => {
      accountsQuery.refetch();
      transactionsQuery.refetch();
    },
  });

  const disconnectMutation = trpc.accounts.disconnect.useMutation({
    onSuccess: () => {
      accountsQuery.refetch();
    },
  });

  const handleConnectClick = (exchange: "coinbase" | "kraken") => {
    setSelectedExchange(exchange);
    setShowConnectModal(true);
  };

  const handleSync = (accountId: number) => {
    syncMutation.mutate({ accountId });
  };

  const handleDisconnect = (accountId: number) => {
    if (confirm("Are you sure you want to disconnect this account?")) {
      disconnectMutation.mutate({ accountId });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Crypto Tax Tracker</h1>
          <p className="text-slate-600">Connect your exchange accounts and annotate transactions for accounting</p>
        </div>

        <Tabs defaultValue="accounts" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="accounts">Connected Accounts</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
          </TabsList>

          {/* Accounts Tab */}
          <TabsContent value="accounts" className="space-y-6">
            {/* Add Account Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-2 border-dashed hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer">
                <CardHeader
                  onClick={() => handleConnectClick("coinbase")}
                  className="text-center py-8"
                >
                  <Plus className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <CardTitle className="text-lg">Connect Coinbase</CardTitle>
                  <CardDescription>Add your Coinbase account</CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-2 border-dashed hover:border-purple-400 hover:bg-purple-50 transition-colors cursor-pointer">
                <CardHeader
                  onClick={() => handleConnectClick("kraken")}
                  className="text-center py-8"
                >
                  <Plus className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                  <CardTitle className="text-lg">Connect Kraken</CardTitle>
                  <CardDescription>Add your Kraken account</CardDescription>
                </CardHeader>
              </Card>
            </div>

            {/* Connected Accounts List */}
            {accountsQuery.data && accountsQuery.data.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-slate-900">Your Connected Accounts</h2>
                {accountsQuery.data.map((account) => (
                  <Card key={account.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="capitalize">{account.exchange}</CardTitle>
                          <CardDescription>{account.accountName}</CardDescription>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-slate-600">
                            Status: <span className={`capitalize ${
                              account.syncStatus === 'success' ? 'text-green-600' :
                              account.syncStatus === 'syncing' ? 'text-blue-600' :
                              account.syncStatus === 'error' ? 'text-red-600' :
                              'text-slate-600'
                            }`}>
                              {account.syncStatus}
                            </span>
                          </p>
                          {account.lastSyncedAt && (
                            <p className="text-xs text-slate-500">
                              Last synced: {new Date(account.lastSyncedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleSync(account.id)}
                          disabled={syncMutation.isPending}
                          variant="outline"
                          size="sm"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          {syncMutation.isPending ? "Syncing..." : "Sync Transactions"}
                        </Button>
                        <Button
                          onClick={() => handleDisconnect(account.id)}
                          disabled={disconnectMutation.isPending}
                          variant="destructive"
                          size="sm"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Disconnect
                        </Button>
                      </div>
                      {account.syncError && (
                        <p className="text-sm text-red-600 mt-2">{account.syncError}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {accountsQuery.isLoading && (
              <div className="text-center py-8">
                <p className="text-slate-600">Loading accounts...</p>
              </div>
            )}
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions">
            <TransactionsTable transactions={transactionsQuery.data || []} isLoading={transactionsQuery.isLoading} />
          </TabsContent>

          {/* Export Tab */}
          <TabsContent value="export">
            <ExportPanel />
          </TabsContent>
        </Tabs>
      </div>

      {/* Connect Account Modal */}
      {selectedExchange && (
        <ConnectAccountModal
          exchange={selectedExchange}
          open={showConnectModal}
          onOpenChange={setShowConnectModal}
          onSuccess={() => {
            setShowConnectModal(false);
            accountsQuery.refetch();
          }}
        />
      )}
    </div>
  );
}
