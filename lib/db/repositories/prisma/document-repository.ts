import 'server-only';

import type { PrismaClient } from '@prisma/client';

import { createId } from '@/lib/utils/crypto';
import type {
  CreateDocumentInput,
  DocumentRecord,
  DocumentStatus,
} from '../../types';

export class DocumentRepository {
  constructor(private readonly client: PrismaClient) {}

  async create(input: CreateDocumentInput): Promise<DocumentRecord> {
    return (await this.client.document.create({
      data: {
        id: input.id ?? createId('doc'),
        userId: input.userId ?? null,
        registrationId: input.registrationId ?? null,
        documentType: input.documentType,
        fileName: input.fileName,
        storageKey: input.storageKey,
        mimeType: input.mimeType,
        fileSize: input.fileSize,
      },
    })) as DocumentRecord;
  }

  async getById(id: string): Promise<DocumentRecord | null> {
    return (await this.client.document.findUnique({ where: { id } })) as DocumentRecord | null;
  }

  async listByUserId(userId: string): Promise<DocumentRecord[]> {
    return (await this.client.document.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })) as DocumentRecord[];
  }

  async listByRegistrationId(registrationId: string): Promise<DocumentRecord[]> {
    return (await this.client.document.findMany({
      where: { registrationId },
      orderBy: { createdAt: 'desc' },
    })) as DocumentRecord[];
  }

  /** Document counts keyed by user — avoids N+1 queries in the admin queue. */
  async countByUserIds(userIds: string[]): Promise<Map<string, number>> {
    if (userIds.length === 0) return new Map();

    const rows = await this.client.document.groupBy({
      by: ['userId'],
      where: { userId: { in: userIds } },
      _count: { _all: true },
    });

    return new Map(
      rows
        .filter((row): row is typeof row & { userId: string } => row.userId !== null)
        .map((row) => [row.userId, row._count._all]),
    );
  }

  async attachToUser(registrationId: string, userId: string): Promise<number> {
    const result = await this.client.document.updateMany({
      where: { registrationId },
      data: { userId, registrationId: null },
    });
    return result.count;
  }

  async updateStatus(
    id: string,
    status: DocumentStatus,
  ): Promise<DocumentRecord | null> {
    return (await this.client.document.update({
      where: { id },
      data: { verificationStatus: status },
    })) as DocumentRecord;
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.client.document.findUnique({ where: { id } });
    if (!existing) return false;
    await this.client.document.delete({ where: { id } });
    return true;
  }
}
