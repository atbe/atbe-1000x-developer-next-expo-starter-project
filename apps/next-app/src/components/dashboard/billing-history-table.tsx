import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import { Button } from '~/components/ui/button';
import { Loader2, Download, ExternalLink, TrendingUp } from 'lucide-react';
import { trpc } from '~/utils/trpc';

interface BillingHistoryTableProps {
  limit?: number;
  showTitle?: boolean;
}

export function BillingHistoryTable({
  limit = 5,
  showTitle = true,
}: BillingHistoryTableProps) {
  const { data: billingHistory, isLoading } =
    trpc.billing.getBillingHistory.useQuery({ limit });

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  return (
    <Card className="ring-1 ring-purple-500/20">
      {showTitle && (
        <CardHeader className="pb-4 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
            Recent Billing History
          </CardTitle>
          <CardDescription className="text-sm">
            Your recent invoices and receipts
          </CardDescription>
        </CardHeader>
      )}
      <CardContent className={showTitle ? 'pt-0 sm:pt-6' : ''}>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
          </div>
        ) : billingHistory && billingHistory.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Invoice</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {billingHistory.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {format(
                          new Date(invoice.created * 1000),
                          'MMM dd, yyyy',
                        )}
                      </TableCell>
                      <TableCell>
                        {invoice.description || 'Premium Subscription'}
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-purple-600 dark:text-purple-400">
                          {formatCurrency(
                            invoice.amount_paid,
                            invoice.currency,
                          )}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            invoice.status === 'paid' ? 'default' : 'secondary'
                          }
                          className={
                            invoice.status === 'paid'
                              ? 'bg-green-500 text-white border-0'
                              : ''
                          }
                        >
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {invoice.hosted_invoice_url && (
                            <a
                              href={invoice.hosted_invoice_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button size="sm" variant="ghost">
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </a>
                          )}
                          {invoice.invoice_pdf && (
                            <a
                              href={invoice.invoice_pdf}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button size="sm" variant="ghost">
                                <Download className="h-4 w-4" />
                              </Button>
                            </a>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="sm:hidden space-y-3">
              {billingHistory.map((invoice) => (
                <div
                  key={invoice.id}
                  className="p-4 rounded-lg bg-secondary/30 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm">
                        {invoice.description || 'Premium Subscription'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(
                          new Date(invoice.created * 1000),
                          'MMM dd, yyyy',
                        )}
                      </p>
                    </div>
                    <Badge
                      variant={
                        invoice.status === 'paid' ? 'default' : 'secondary'
                      }
                      className={
                        invoice.status === 'paid'
                          ? 'bg-green-500 text-white border-0'
                          : ''
                      }
                    >
                      {invoice.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="font-semibold text-purple-600 dark:text-purple-400">
                      {formatCurrency(invoice.amount_paid, invoice.currency)}
                    </span>
                    <div className="flex gap-2">
                      {invoice.hosted_invoice_url && (
                        <a
                          href={invoice.hosted_invoice_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button size="sm" variant="ghost">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </a>
                      )}
                      {invoice.invoice_pdf && (
                        <a
                          href={invoice.invoice_pdf}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button size="sm" variant="ghost">
                            <Download className="h-4 w-4" />
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-8 sm:py-12 rounded-lg bg-secondary/20">
            <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">📊</div>
            <p className="text-muted-foreground text-sm">
              No billing history yet
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
