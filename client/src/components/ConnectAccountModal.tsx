import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface ConnectAccountModalProps {
  exchange: "coinbase" | "kraken";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function ConnectAccountModal({
  exchange,
  open,
  onOpenChange,
  onSuccess,
}: ConnectAccountModalProps) {
  const [accountName, setAccountName] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [error, setError] = useState("");

  const connectCoinbaseMutation = trpc.accounts.connectCoinbase.useMutation();
  const connectKrakenMutation = trpc.accounts.connectKraken.useMutation();

  const isLoading = connectCoinbaseMutation.isPending || connectKrakenMutation.isPending;

  const handleConnect = async () => {
    setError("");

    if (!accountName.trim()) {
      setError("Account name is required");
      return;
    }

    try {
      if (exchange === "coinbase") {
        if (!accessToken.trim()) {
          setError("Access token is required");
          return;
        }
        await connectCoinbaseMutation.mutateAsync({
          accountName,
          accessToken,
        });
      } else {
        if (!apiKey.trim() || !apiSecret.trim()) {
          setError("API Key and API Secret are required");
          return;
        }
        await connectKrakenMutation.mutateAsync({
          accountName,
          apiKey,
          apiSecret,
        });
      }

      toast.success(`${exchange} account connected successfully!`);
      setAccountName("");
      setAccessToken("");
      setApiKey("");
      setApiSecret("");
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to connect account";
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="capitalize">Connect {exchange} Account</DialogTitle>
          <DialogDescription>
            Enter your {exchange} API credentials to sync transactions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Account Name */}
          <div className="space-y-2">
            <Label htmlFor="account-name">Account Name</Label>
            <Input
              id="account-name"
              placeholder="e.g., My Coinbase Trading Account"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-slate-500">
              A friendly name to identify this account in the app
            </p>
          </div>

          {/* Coinbase Fields */}
          {exchange === "coinbase" && (
            <div className="space-y-2">
              <Label htmlFor="access-token">Access Token</Label>
              <Input
                id="access-token"
                type="password"
                placeholder="Your Coinbase API access token"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-xs text-slate-500">
                Get this from Coinbase Settings → API → Create New API Key
              </p>
            </div>
          )}

          {/* Kraken Fields */}
          {exchange === "kraken" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="api-key">API Key</Label>
                <Input
                  id="api-key"
                  type="password"
                  placeholder="Your Kraken API key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="api-secret">API Secret</Label>
                <Input
                  id="api-secret"
                  type="password"
                  placeholder="Your Kraken API secret"
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <p className="text-xs text-slate-500">
                Get these from Kraken Settings → API → Create New API Key. Ensure permissions include "Query ledger entries" and "Query closed orders & trades"
              </p>
            </>
          )}

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Security Notice */}
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Your API credentials are encrypted and stored securely. We only use them to fetch your transaction history.
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConnect}
              disabled={isLoading}
            >
              {isLoading ? "Connecting..." : "Connect Account"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
