import type { Metadata } from 'next';
import Link from 'next/link';
import { Package, Pill, ShoppingCart } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { CancelOrderButton } from '@/components/patient/care/CancelOrderButton';
import { OrderStatusBadge } from '@/components/patient/care/StatusBadge';
import { requireRoleLayout } from '@/lib/auth/role-guard';
import { listOrders } from '@/lib/services/orderService';
import { formatDate, formatDateTime, formatInr } from '@/lib/utils/format';

export const metadata: Metadata = {
  title: 'Order History',
  description: 'Your pharmacy orders and their status.',
};

/**
 * Order history — every order the patient placed, newest first, with its
 * medicine lines and live status. Cancelling is allowed while the order is
 * still `PLACED`; after that the pharmacy drives the status.
 */
export default async function OrdersPage() {
  const user = await requireRoleLayout(['PATIENT']);
  const orders = await listOrders(user.id);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight text-navy-900">
            Order history
          </h1>
          <p className="text-sm text-muted-foreground">
            Everything you have ordered from verified pharmacies.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/patient/medicines">
            <Pill className="size-4" aria-hidden="true" />
            Find medicines
          </Link>
        </Button>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="No orders yet"
          description="Orders you place from Find medicines appear here with their delivery status."
          note="Stock is reserved the moment an order is placed, so the price you see is the price you pay."
          action={
            <Button asChild>
              <Link href="/patient/medicines">Search medicines</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {orders.map(({ order, pharmacyName }) => (
            <Card key={order.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                    <Package className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-[15px] font-bold text-navy-900">
                        {pharmacyName}
                      </h2>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <p className="text-[13px] text-muted-foreground">
                      Placed {formatDateTime(order.createdAt)} ·{' '}
                      {order.items.length} line{order.items.length === 1 ? '' : 's'}
                    </p>
                    {order.deliveryAddress && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Deliver to: {order.deliveryAddress}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-display text-lg font-bold text-navy-900">
                    {formatInr(order.totalInPaise)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    #{order.id.slice(-8)}
                  </p>
                </div>
              </div>

              <ul className="mt-4 space-y-2">
                {order.items.map((line) => (
                  <li
                    key={line.id}
                    className="flex items-center justify-between gap-3 text-[13px]"
                  >
                    <span className="min-w-0 truncate">
                      {line.medicineName}
                      <span className="text-muted-foreground"> × {line.quantity}</span>
                    </span>
                    <span className="shrink-0 font-semibold text-navy-900">
                      {formatInr(line.unitPriceInPaise * line.quantity)}
                    </span>
                  </li>
                ))}
              </ul>

              {order.status === 'PLACED' && (
                <div className="mt-4 flex justify-end border-t border-border pt-3">
                  <CancelOrderButton orderId={order.id} />
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}