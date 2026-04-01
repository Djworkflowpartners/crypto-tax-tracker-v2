import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = [
  "Income",
  "Business Expense",
  "Personal Transfer",
  "Tax Payment",
  "Fee",
  "Staking Reward",
  "Dividend",
  "Trade",
  "Other",
];

export default function ExportPanel() {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const exportAllQuery = trpc.export.toCSV.useQuery({ includeEmpty: false });
  const exportByDateQuery = trpc.export.toCSVByDateRange.useQuery(
    {
      startDate: startDate || new Date(0).toISOString().split("T")[0],
      endDate: endDate || new Date().toISOString().split("T")[0],
    },
    { enabled: false }
  );
  const exportByCategoryQuery = trpc.export.toCSVByCategory.useQuery(
    { category: selectedCategory },
    { enabled: false }
  );

  const handleDownloadCSV = (csv: string, filename: string) => {
    if (!csv) {
      toast.error("No data to export");
      return;
    }

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Downloaded ${filename}`);
  };

  const handleExportAll = async () => {
    const result = await exportAllQuery.refetch();
    if (result.data?.csv) {
      handleDownloadCSV(result.data.csv, result.data.filename);
    }
  };

  const handleExportByDate = async () => {
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates");
      return;
    }

    const result = await exportByDateQuery.refetch();
    if (result.data?.csv) {
      handleDownloadCSV(result.data.csv, result.data.filename);
    }
  };

  const handleExportByCategory = async () => {
    if (!selectedCategory) {
      toast.error("Please select a category");
      return;
    }

    const result = await exportByCategoryQuery.refetch();
    if (result.data?.csv) {
      handleDownloadCSV(result.data.csv, result.data.filename);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Export Transactions</CardTitle>
        <CardDescription>Download your annotated transactions as CSV</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All Transactions</TabsTrigger>
            <TabsTrigger value="date">By Date Range</TabsTrigger>
            <TabsTrigger value="category">By Category</TabsTrigger>
          </TabsList>

          {/* All Transactions */}
          <TabsContent value="all" className="space-y-4">
            <p className="text-sm text-slate-600">
              Export all your transactions with annotations to a CSV file.
            </p>
            <Button
              onClick={handleExportAll}
              disabled={exportAllQuery.isFetching}
              className="w-full"
            >
              {exportAllQuery.isFetching ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Preparing...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download All Transactions
                </>
              )}
            </Button>
          </TabsContent>

          {/* By Date Range */}
          <TabsContent value="date" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <Button
                onClick={handleExportByDate}
                disabled={exportByDateQuery.isFetching || !startDate || !endDate}
                className="w-full"
              >
                {exportByDateQuery.isFetching ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Preparing...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Download by Date Range
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          {/* By Category */}
          <TabsContent value="category" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleExportByCategory}
                disabled={exportByCategoryQuery.isFetching || !selectedCategory}
                className="w-full"
              >
                {exportByCategoryQuery.isFetching ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Preparing...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Download by Category
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>CSV Format:</strong> The exported file includes all transaction details (date, exchange, type, amounts, fees) plus your annotations (category, description, notes). Perfect for tax preparation and accounting software.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
