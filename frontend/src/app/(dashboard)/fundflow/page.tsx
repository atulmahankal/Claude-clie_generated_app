'use client';

import { useState } from 'react';
import { useTransactions, useCategories } from '@/lib/hooks/use-fundflow';
import { CreateTransactionDialog } from '@/components/fundflow/create-transaction-dialog';
import { EditTransactionDialog } from '@/components/fundflow/edit-transaction-dialog';
import { CreateCategoryDialog } from '@/components/fundflow/create-category-dialog';
import { TransactionItem } from '@/components/fundflow/transaction-item';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign } from 'lucide-react';
import type { Transaction } from '@/lib/api/fundflow';

export default function FundflowPage() {
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const { data: transactions, isLoading: transactionsLoading } = useTransactions();
  const { data: categories, isLoading: categoriesLoading } = useCategories();

  function handleEditTransaction(transaction: Transaction) {
    setEditingTransaction(transaction);
    setEditDialogOpen(true);
  }

  // Calculate totals
  const totalIncome = transactions?.reduce(
    (sum, t) => sum + (t.type === 'income' ? t.amount : 0),
    0
  ) || 0;

  const totalExpenses = transactions?.reduce(
    (sum, t) => sum + (t.type === 'expense' ? t.amount : 0),
    0
  ) || 0;

  const netSavings = totalIncome - totalExpenses;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fundflow</h1>
          <p className="text-muted-foreground mt-1">
            Track your income and expenses
          </p>
        </div>
        <div className="flex gap-2">
          <CreateCategoryDialog />
          <CreateTransactionDialog />
        </div>
      </div>

      <Separator />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Income</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              ${totalIncome.toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Expenses</CardDescription>
            <CardTitle className="text-2xl text-red-600">
              ${totalExpenses.toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Net Savings</CardDescription>
            <CardTitle className="text-2xl">
              ${netSavings.toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="recurring">Recurring</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          {transactionsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : transactions && transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((transaction) => (
                  <TransactionItem
                    key={transaction.id}
                    transaction={transaction}
                    onEdit={handleEditTransaction}
                  />
                ))}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>No Transactions Yet</CardTitle>
                </div>
                <CardDescription>
                  Start tracking your finances by adding your first transaction
                </CardDescription>
              </CardHeader>
              <CardContent>
                {categoriesLoading ? (
                  <Skeleton className="h-10 w-40" />
                ) : categories && categories.length > 0 ? (
                  <CreateTransactionDialog />
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Create a category first before adding transactions
                    </p>
                    <CreateCategoryDialog />
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="recurring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recurring Transactions</CardTitle>
              <CardDescription>
                Manage your recurring income and expenses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Recurring transactions feature coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Statistics & Charts</CardTitle>
              <CardDescription>
                Visualize your financial data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Statistics and charts feature coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <EditTransactionDialog
        transaction={editingTransaction}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />
    </div>
  );
}
