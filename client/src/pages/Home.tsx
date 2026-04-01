import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { useEffect } from "react";
import { useLocation } from "wouter";

/**
 * Home page - serves as landing page for unauthenticated users
 * Authenticated users are redirected to the Dashboard
 */
export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, loading, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page for unauthenticated users
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Crypto Tax Tracker</h1>
        <p className="text-slate-600 mb-8">
          Connect your exchange accounts and annotate transactions for seamless tax accounting
        </p>
        
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">Get Started</h2>
          
          <div className="space-y-4">
            <div className="text-left">
              <h3 className="font-semibold text-slate-900 mb-2">✓ Connect Accounts</h3>
              <p className="text-sm text-slate-600">Link your Coinbase and Kraken accounts securely</p>
            </div>
            
            <div className="text-left">
              <h3 className="font-semibold text-slate-900 mb-2">✓ Sync Transactions</h3>
              <p className="text-sm text-slate-600">Automatically fetch and organize all your trades</p>
            </div>
            
            <div className="text-left">
              <h3 className="font-semibold text-slate-900 mb-2">✓ Annotate & Export</h3>
              <p className="text-sm text-slate-600">Add notes and export to CSV for tax preparation</p>
            </div>
          </div>

          <Button 
            onClick={() => window.location.href = getLoginUrl()}
            className="w-full mt-8 bg-blue-600 hover:bg-blue-700 text-white"
            size="lg"
          >
            Sign In with Manus
          </Button>
        </div>

        <p className="text-xs text-slate-500 mt-6">
          Your API credentials are encrypted and never shared
        </p>
      </div>
    </div>
  );
}
