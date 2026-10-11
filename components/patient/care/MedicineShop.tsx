'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Minus, Package, Plus, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';

import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ApiError, apiRequest } from '@/lib/utils/api-client';
import { formatInr } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

export interface ShopItem {
  medicine: {
    id: string;
    name: string;
    brand: string | null;
    strength: string | null;
    priceInPaise: number;
    stockQuantity: number;
    requiresRx: boolean;
  };
  pharmacyUserId: string;
  pharmacyName: string;
  pharmacyCity: string;
}

interface Cart {
  pharmacyUserId: string;
  lines: Record<string, number>;
}

/**
 * Medicine search results with a single-pharmacy cart.
 *
 * Only `{ medicineId, quantity }` is sent when checking out — the server
 * re-reads price and stock from inventory — and the cart refuses to mix two
 * pharmacies so an order always maps to exactly one fulfilment point.
 */
export function MedicineShop({ items }: { items: ShopItem[] }) {
  const router = useRouter();
  const [cart, setCart] = React.useState<Cart | null>(null);
  const [checkoutOpen, setCheckoutOpen] = React.useState(false);
  const [address, setAddress] = React.useState('');
  const [placing, setPlacing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const pharmacyNameOf = (userId: string) =>
    items.find((item) => item.pharmacyUserId === userId)?.pharmacyName ??
    'this pharmacy';

  const qtyOf = (medicineId: string) => cart?.lines[medicineId] ?? 0;

  const changeQty = (item: ShopItem, delta: number) => {
    setError(null);
    const medicine = item.medicine;
    setCart((current) => {
      if (current && current.pharmacyUserId !== item.pharmacyUserId) {
        toast.warning(
          `Your cart holds items from ${pharmacyNameOf(current.pharmacyUserId)}. Checkout that cart first, or clear it to shop here.`,
        );
        return current;
      }
      const nextQty = Math.max(
        0,
        Math.min(medicine.stockQuantity, qtyOf(medicine.id) + delta),
      );
      const lines = { ...(current?.lines ?? {}) };
      if (nextQty === 0) delete lines[medicine.id];
      else lines[medicine.id] = nextQty;
      const empty = Object.keys(lines).length === 0;
      return empty
        ? null
        : { pharmacyUserId: item.pharmacyUserId, lines };
    });
  };

  const cartCount = cart
    ? Object.values(cart.lines).reduce((sum, qty) => sum + qty, 0)
    : 0;

  const cartTotal = cart
    ? items.reduce(
        (sum, item) => sum + (cart.lines[item.medicine.id] ?? 0) * item.medicine.priceInPaise,
        0,
      )
    : 0;

  const clearCart = () => {
    setCart(null);
    setCheckoutOpen(false);
    setAddress('');
    setError(null);
  };

  const checkout = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!cart) return;
    setPlacing(true);
    setError(null);
    try {
      await apiRequest('/api/patient/orders', {
        method: 'POST',
        body: {
          pharmacyUserId: cart.pharmacyUserId,
          deliveryAddress: address.trim(),
          items: Object.entries(cart.lines).map(([medicineId, quantity]) => ({
            medicineId,
            quantity,
          })),
        },
      });
      toast.success('Order placed', {
        description: 'Track it any time under Order history.',
      });
      setCart(null);
      setCheckoutOpen(false);
      setAddress('');
      router.push('/patient/orders');
      router.refresh();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'We could not place your order.',
      );
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}

      <div className="space-y-3">
        {items.map((item) => {
          const medicine = item.medicine;
          const qty = qtyOf(medicine.id);
          const out = medicine.stockQuantity <= 0;
          return (
            <Card key={medicine.id} className="flex flex-wrap items-center gap-4 p-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                <Package className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-display text-sm font-bold text-navy-900">
                    {medicine.name}
                    {medicine.strength ? ` ${medicine.strength}` : ''}
                  </p>
                  {medicine.requiresRx && (
                    <Badge variant="warning" size="sm">
                      Rx required
                    </Badge>
                  )}
                  {out && (
                    <Badge variant="destructive" size="sm">
                      Out of stock
                    </Badge>
                  )}
                </div>
                <p className="text-[13px] text-muted-foreground">
                  {medicine.brand ? `${medicine.brand} · ` : ''}
                  {item.pharmacyName}
                  {item.pharmacyCity ? ` · ${item.pharmacyCity}` : ''} ·{' '}
                  {medicine.stockQuantity} in stock
                </p>
              </div>
              <p className="text-sm font-bold text-navy-900">
                {formatInr(medicine.priceInPaise)}
              </p>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 rounded-lg border border-border bg-card">
                  <button
                    type="button"
                    className="flex size-8 items-center justify-center text-navy-700 hover:bg-muted disabled:opacity-40"
                    onClick={() => changeQty(item, -1)}
                    disabled={qty === 0}
                    aria-label={`Remove one ${medicine.name}`}
                  >
                    <Minus className="size-4" aria-hidden="true" />
                  </button>
                  <span className="w-6 text-center text-sm font-semibold" aria-live="polite">
                    {qty}
                  </span>
                  <button
                    type="button"
                    className="flex size-8 items-center justify-center text-navy-700 hover:bg-muted disabled:opacity-40"
                    onClick={() => changeQty(item, 1)}
                    disabled={out || qty >= medicine.stockQuantity}
                    aria-label={`Add one ${medicine.name}`}
                  >
                    <Plus className="size-4" aria-hidden="true" />
                  </button>
                </div>
                <Button
                  size="sm"
                  variant={qty > 0 ? 'secondary' : 'primary'}
                  disabled={out || qty > 0}
                  onClick={() => changeQty(item, 1)}
                >
                  {qty > 0 ? 'In cart' : 'Add'}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {cart && (
        <Card className="sticky bottom-4 z-10 space-y-4 p-4 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-display text-sm font-bold text-navy-900">
                <ShoppingCart className="mr-1.5 inline size-4" aria-hidden="true" />
                {cartCount} item{cartCount === 1 ? '' : 's'} ·{' '}
                {pharmacyNameOf(cart.pharmacyUserId)}
              </p>
              <p className="text-[13px] text-muted-foreground">
                Total {formatInr(cartTotal)} — medicines must come from one
                pharmacy per order.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={clearCart}>
                Clear cart
              </Button>
              <Button size="sm" onClick={() => setCheckoutOpen((open) => !open)}>
                {checkoutOpen ? 'Close' : 'Checkout'}
              </Button>
            </div>
          </div>

          {checkoutOpen && (
            <form onSubmit={checkout} className="space-y-3 border-t border-border pt-4">
              <div className="space-y-1.5">
                <Label htmlFor="order-address">
                  Delivery address{' '}
                  <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Textarea
                  id="order-address"
                  value={address}
                  maxLength={300}
                  placeholder="Flat / street, landmark, PIN code"
                  onChange={(event) => setAddress(event.target.value)}
                  className="min-h-16"
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  Payment on delivery is supported in this demo.
                </p>
                <Button type="submit" size="sm" loading={placing}>
                  Place order · {formatInr(cartTotal)}
                </Button>
              </div>
            </form>
          )}
        </Card>
      )}
    </div>
  );
}
