import 'server-only';

import type { PrismaClient } from '@prisma/client';

import { createId } from '@/lib/utils/crypto';
import { Errors } from '@/lib/utils/errors';
import type {
  CreateOrderInput,
  MedicineInventoryRecord,
  OrderWithItems,
  PharmacyOrderRecord,
  UpdateMedicineInventoryInput,
  UpsertMedicineInventoryInput,
} from '../../types';
import type { OrderStatus } from '@prisma/client';

/**
 * Pharmacy commerce: medicine stock and patient orders.
 *
 * Stock validation + decrement live in `createOrder` so the check and the
 * write happen inside one database transaction — no other component mutates
 * `MedicineInventory.stockQuantity`.
 */
export class CommerceRepository {
  constructor(private readonly client: PrismaClient) {}

  // --- inventory ------------------------------------------------------------
  async createMedicine(
    input: UpsertMedicineInventoryInput,
  ): Promise<MedicineInventoryRecord> {
    return (await this.client.medicineInventory.create({
      data: {
        id: createId('med'),
        pharmacyUserId: input.pharmacyUserId,
        name: input.name,
        brand: input.brand ?? null,
        strength: input.strength ?? null,
        unit: input.unit ?? 'TABLET',
        priceInPaise: input.priceInPaise,
        stockQuantity: input.stockQuantity,
        requiresRx: input.requiresRx ?? false,
      },
    })) as MedicineInventoryRecord;
  }

  async updateMedicine(
    id: string,
    patch: UpdateMedicineInventoryInput,
  ): Promise<MedicineInventoryRecord> {
    const existing = await this.client.medicineInventory.findUnique({
      where: { id },
    });
    if (!existing) throw Errors.notFound('That medicine could not be found.');
    return (await this.client.medicineInventory.update({
      where: { id },
      data: {
        ...(patch.name !== undefined ? { name: patch.name } : {}),
        ...(patch.brand !== undefined ? { brand: patch.brand } : {}),
        ...(patch.strength !== undefined ? { strength: patch.strength } : {}),
        ...(patch.unit !== undefined ? { unit: patch.unit } : {}),
        ...(patch.priceInPaise !== undefined
          ? { priceInPaise: patch.priceInPaise }
          : {}),
        ...(patch.stockQuantity !== undefined
          ? { stockQuantity: patch.stockQuantity }
          : {}),
        ...(patch.requiresRx !== undefined ? { requiresRx: patch.requiresRx } : {}),
      },
    })) as MedicineInventoryRecord;
  }

  async getMedicineById(id: string): Promise<MedicineInventoryRecord | null> {
    return (await this.client.medicineInventory.findUnique({
      where: { id },
    })) as MedicineInventoryRecord | null;
  }

  async listMedicinesByPharmacy(
    pharmacyUserId: string,
  ): Promise<MedicineInventoryRecord[]> {
    return (await this.client.medicineInventory.findMany({
      where: { pharmacyUserId },
      orderBy: { name: 'asc' },
    })) as MedicineInventoryRecord[];
  }

  async searchMedicines(
    text: string,
    pharmacyUserIds: string[],
  ): Promise<MedicineInventoryRecord[]> {
    if (pharmacyUserIds.length === 0) return [];
    const needle = text.trim();
    return (await this.client.medicineInventory.findMany({
      where: {
        pharmacyUserId: { in: pharmacyUserIds },
        ...(needle
          ? {
              OR: [
                { name: { contains: needle, mode: 'insensitive' as const } },
                { brand: { contains: needle, mode: 'insensitive' as const } },
                { strength: { contains: needle, mode: 'insensitive' as const } },
              ],
            }
          : {}),
      },
      orderBy: { name: 'asc' },
    })) as MedicineInventoryRecord[];
  }

  // --- orders ---------------------------------------------------------------
  async createOrder(input: CreateOrderInput): Promise<OrderWithItems> {
    if (input.items.length === 0) {
      throw Errors.validation('Please add at least one medicine to your order.');
    }
    return (await this.client.$transaction(async (tx) => {
      // Re-read stock inside the transaction: the check and the decrement are
      // one atomic step, so concurrent orders cannot oversell.
      for (const item of input.items) {
        if (!item.medicineId) continue;
        const medicine = await tx.medicineInventory.findUnique({
          where: { id: item.medicineId },
        });
        if (!medicine) {
          throw Errors.notFound('A medicine in your order is no longer available.');
        }
        if (medicine.stockQuantity < item.quantity) {
          throw Errors.conflict(
            `Only ${medicine.stockQuantity} unit(s) of ${medicine.name} are in stock.`,
          );
        }
      }
      for (const item of input.items) {
        if (!item.medicineId) continue;
        await tx.medicineInventory.update({
          where: { id: item.medicineId },
          data: { stockQuantity: { decrement: item.quantity } },
        });
      }
      const order = await tx.pharmacyOrder.create({
        data: {
          id: createId('ord'),
          patientUserId: input.patientUserId,
          pharmacyUserId: input.pharmacyUserId,
          totalInPaise: input.items.reduce(
            (sum, item) => sum + item.quantity * item.unitPriceInPaise,
            0,
          ),
          deliveryAddress: input.deliveryAddress ?? null,
          items: {
            create: input.items.map((item) => ({
              id: createId('ori'),
              medicineId: item.medicineId,
              medicineName: item.medicineName,
              quantity: item.quantity,
              unitPriceInPaise: item.unitPriceInPaise,
            })),
          },
        },
        include: { items: true },
      });
      return order as OrderWithItems;
    })) as OrderWithItems;
  }

  async getOrderById(id: string): Promise<OrderWithItems | null> {
    const row = await this.client.pharmacyOrder.findUnique({
      where: { id },
      include: { items: true },
    });
    return row as OrderWithItems | null;
  }

  async listOrdersByPatient(patientUserId: string): Promise<OrderWithItems[]> {
    const rows = await this.client.pharmacyOrder.findMany({
      where: { patientUserId },
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });
    return rows as OrderWithItems[];
  }

  async updateOrderStatus(
    id: string,
    status: OrderStatus,
  ): Promise<PharmacyOrderRecord> {
    const existing = await this.client.pharmacyOrder.findUnique({ where: { id } });
    if (!existing) throw Errors.notFound('That order could not be found.');
    return (await this.client.pharmacyOrder.update({
      where: { id },
      data: { status },
    })) as PharmacyOrderRecord;
  }
}