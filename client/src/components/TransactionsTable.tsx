import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Transaction {
  id: number;
  exchange: string;
  type: string;
  status: string;
  amount: string;
  currency: string;
  nativeAmount: string | null;
  nativeCurrency: string | null;
  fee: string | null;
  feeCurrency: string | null;
  counterparty: string | null;
  date: Date;
  description: string;
  category: string;
  notes: string;
}

interface TransactionsTableProps {
  transactions: Transaction[];
  isLoading: boolean;
}

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

export default function TransactionsTable({
  transactions,
  isLoading,
}: TransactionsTableProps) {
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editData, setEditData] = useState({
    description: "",
    category: "",
    notes: "",
  });

  const updateAnnotationMutation = trpc.transactions.updateAnnotation.useMutation({
    onSuccess: () => {
      toast.success("Transaction updated successfully!");
      setShowEditDialog(false);
      setSelectedTransaction(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update transaction");
    },
  });

  const handleEditClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setEditData({
      description: transaction.description || "",
      category: transaction.category || "",
      notes: transaction.notes || "",
    });
    setShowEditDialog(true);
  };

  const handleSaveAnnotation = async () => {
    if (!selectedTransaction) return;

    await updateAnnotationMutation.mutateAsync({
      transactionId: selectedTransaction.id,
      description: editData.description || undefined,
      category: editData.category || undefined,
      notes: editData.notes || undefined,
    });
  };

  const formatAmount = (amount: string | null, currency: string | null) => {
    if (!amount) return "-";
    const num = parseFloat(amount);
    return `${num.toFixed(8)} ${currency || ""}`.trim();
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Transactions</CardTitle>
          <CardDescription>
            Connect an exchange account and sync transactions to get started
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            {transactions.length} transaction{transactions.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Exchange</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Native Amount</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="text-sm">
                      {formatDate(tx.date)}
                    </TableCell>
                    <TableCell className="capitalize font-medium">
                      {tx.exchange}
                    </TableCell>
                    <TableCell className="capitalize text-sm">
                      {tx.type}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatAmount(tx.amount, tx.currency)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatAmount(tx.nativeAmount, tx.nativeCurrency)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {tx.category ? (
                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                          {tx.category}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm max-w-xs truncate">
                      {tx.description || <span className="text-slate-400">-</span>}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditClick(tx)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Transaction Dialog */}
      {selectedTransaction && (
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Transaction</DialogTitle>
              <DialogDescription>
                Update the description and category for this transaction
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Transaction Summary */}
              <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Date:</span>
                  <span className="font-medium">{formatDate(selectedTransaction.date)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Amount:</span>
                  <span className="font-medium">
                    {formatAmount(selectedTransaction.amount, selectedTransaction.currency)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Type:</span>
                  <span className="font-medium capitalize">{selectedTransaction.type}</span>
                </div>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={editData.category}
                  onValueChange={(value) =>
                    setEditData({ ...editData, category: value })
                  }
                >
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

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="e.g., Office equipment purchase"
                  value={editData.description}
                  onChange={(e) =>
                    setEditData({ ...editData, description: e.target.value })
                  }
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes for accounting..."
                  value={editData.notes}
                  onChange={(e) =>
                    setEditData({ ...editData, notes: e.target.value })
                  }
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowEditDialog(false)}
                  disabled={updateAnnotationMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveAnnotation}
                  disabled={updateAnnotationMutation.isPending}
                >
                  {updateAnnotationMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
