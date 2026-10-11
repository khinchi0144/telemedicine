import 'server-only';

import { getStore } from '@/lib/db';
import type {
  MedicineInventoryRecord,
  OrderWithItems,
} from '@/lib/db/types';
import { Errors } from '@/lib/utils/errors';
import type { PlaceOrderInput } from '@/lib/validations/care';

/**
 * Patient-facing pharmacy commerce: medicine search across verified
 * pharmacies, order placement, and order history.
 *
 * Prices are always resolved server side from `MedicineInventory` at order
 * time — the client only sends `{ medicineId, quantity }`, so a crafted
 * payload cannot choose its own price or order from an unverified pharmacy.
 */

export interface MedicineSearchItem {
  medicine: MedicineInventoryRecord;
  pharmacyUserId: string;
  pharmacyName: string;
  pharmacyCity: string;
}

export interface OrderListItem {
  order: OrderWithItems;
  pharmacyName: string;
}

/** Verified pharmacies for the "Nearby pharmacies" directory. */
export async function searchPharmacies(params: {
  q?: string;
  city?: string;
}) {
  const store = await getStore();
  return store.listPharmacyProfiles({
    verificationStatus: 'VERIFIED',
    ...(params.city ? { city: params.city } : {}),
    ...(params.q ? { text: params.q } : {}),
  });
}

/**
 * Searches stock across every verified pharmacy (optionally limited to a
 * city). Returns display rows ready for the results table.
 */
export async function searchMedicines(params: {
  q?: string;
  city?: string;
}): Promise<MedicineSearchItem[]> {
  const store = await getStore();
  const pharmacies = await store.listPharmacyProfiles({
    verificationStatus: 'VERIFIED',
    ...(params.city ? { city: params.city } : {}),
  });
  if (pharmacies.length === 0) return [];
  const byUserId = new Map(pharmacies.map((row) => [row.userId, row]));

  const medicines = await store.searchMedicines(
    params.q ?? '',
    pharmacies.map((row) => row.userId),
  );
  return medicines.map((medicine) => {
    const pharmacy = byUserId.get(medicine.pharmacyUserId);
    return {
      medicine,
      pharmacyUserId: medicine.pharmacyUserId,
      pharmacyName: pharmacy?.pharmacyName ?? 'Pharmacy',
      pharmacyCity: pharmacy?.city ?? '',
    };
  });
}

/**
 * Places an order from cart lines `{ medicineId, quantity }`.
 * Each line is re-read from inventory so price, name, stock and pharmacy are
 * the server's truth — and every line must belong to the pharmacy the order
 * is addressed to.
 */
export async function placeOrder(
  patientUserId: string,
  input: PlaceOrderInput,
): Promise<OrderWithItems> {
  const store = await getStore();
  const lines = [];
  for (const item of input.items) {
    const medicine = await store.getMedicineById(item.medicineId);
    if (!medicine) {
      throw Errors.notFound('A medicine in your cart is no longer available.');
    }
    if (medicine.pharmacyUserId !== input.pharmacyUserId) {
      throw Errors.validation('Please order medicines from one pharmacy at a time.');
    }
    lines.push({
      medicineId: medicine.id,
      medicineName: medicine.name,
      quantity: item.quantity,
      unitPriceInPaise: medicine.priceInPaise,
    });
  }

  // Stock validation + decrement happen atomically inside the store.
  return store.createOrder({
    patientUserId,
    pharmacyUserId: input.pharmacyUserId,
    deliveryAddress: input.deliveryAddress ?? null,
    items: lines,
  });
}

/** The patient's orders, newest first, each labelled with its pharmacy. */
export async function listOrders(patientUserId: string): Promise<OrderListItem[]> {
  const store = await getStore();
  const orders = await store.listOrdersByPatient(patientUserId);
  const items: OrderListItem[] = [];
  for (const order of orders) {
    const pharmacy = await store.getPharmacyProfileByUserId(order.pharmacyUserId);
    items.push({
      order,
      pharmacyName: pharmacy?.pharmacyName ?? 'Pharmacy',
    });
  }
  return items;
}

/**
 * Cancels one of the patient's own orders. Only `PLACED` orders can still be
 * cancelled — once the pharmacy starts preparing it, the status must change
 * on their side.
 */
export async function cancelOrder(
  patientUserId: string,
  orderId: string,
): Promise<OrderWithItems> {
  const store = await getStore();
  const order = await store.getOrderById(orderId);
  if (!order || order.patientUserId !== patientUserId) {
    throw Errors.notFound('That order could not be found.');
  }
  if (order.status !== 'PLACED') {
    throw Errors.conflict(
      'This order has already been prepared and can no longer be cancelled.',
    );
  }
  await store.updateOrderStatus(orderId, 'CANCELLED');
  const updated = await store.getOrderById(orderId);
  if (!updated) throw Errors.notFound('That order could not be found.');
  return updated;
}