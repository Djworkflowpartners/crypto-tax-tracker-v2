import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import { useAuth } from "./_core/hooks/useAuth";

function Router() {
  const { isAuthenticated, loading } = useAuth();

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

  // If not authenticated, show a simple login page
  if (!isAuthenticated) {
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

            <button 
              onClick={() => {
                const loginUrl = new URL(window.location.href);
                loginUrl.searchParams.set('login', '1');
                window.location.href = loginUrl.toString();
              }}
              className="w-full mt-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              Sign In
            </button>
          </div>

          <p className="text-xs text-slate-500 mt-6">
            Your API credentials are encrypted and never shared
          </p>
        </div>
      </div>
    );
  }

  // Authenticated users always see the Dashboard
  return (
    <Switch>
      <Route path={"/"} component={Dashboard} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
