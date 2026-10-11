import 'server-only';

import type { PrismaClient } from '@prisma/client';

import { Errors } from '@/lib/utils/errors';
import { createId } from '@/lib/utils/crypto';
import type {
  CreateUserInput,
  LinkedAccountRecord,
  UpdateUserInput,
  UserRecord,
} from '../../types';

/**
 * Translates the Prisma "unique constraint" error into domain errors so the
 * service layer never imports Prisma and raw driver errors never surface.
 */
export function assertWritable(
  error: unknown,
  context: { email?: string | null; mobile?: string } = {},
): never {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'P2002'
  ) {
    const target = JSON.stringify(
      (error as { meta?: { target?: unknown } }).meta?.target ?? '',
    );
    if (context.email && target.includes('email')) throw Errors.emailTaken();
    if (context.mobile && target.includes('mobile')) throw Errors.mobileTaken();
    throw Errors.conflict('This record already exists.');
  }
  throw error;
}

export class UserRepository {
  constructor(private readonly client: PrismaClient) {}

  async findUserById(id: string): Promise<UserRecord | null> {
    return (await this.client.user.findUnique({ where: { id } })) as UserRecord | null;
  }

  async findUserByEmail(email: string): Promise<UserRecord | null> {
    return (await this.client.user.findUnique({
      where: { email: email.toLowerCase() },
    })) as UserRecord | null;
  }

  async findUserByMobile(mobile: string): Promise<UserRecord | null> {
    return (await this.client.user.findUnique({ where: { mobile } })) as UserRecord | null;
  }

  /** Used by the admin console to attach account data to professional profiles. */
  async listByRole(role: UserRecord['role']): Promise<UserRecord[]> {
    return (await this.client.user.findMany({
      where: { role },
      orderBy: { createdAt: 'desc' },
    })) as UserRecord[];
  }

  async createUser(input: CreateUserInput): Promise<UserRecord> {
    try {
      return (await this.client.user.create({
        data: {
          id: input.id ?? createId('usr'),
          role: input.role,
          email: input.email ? input.email.toLowerCase() : null,
          mobile: input.mobile,
          passwordHash: input.passwordHash ?? null,
          status: input.status ?? 'ACTIVE',
          isEmailVerified: input.isEmailVerified ?? false,
          isMobileVerified: input.isMobileVerified ?? false,
        },
      })) as UserRecord;
    } catch (error) {
      assertWritable(error, { email: input.email, mobile: input.mobile });
    }
  }

  async updateUser(id: string, patch: UpdateUserInput): Promise<UserRecord> {
    try {
      return (await this.client.user.update({
        where: { id },
        data: {
          ...(patch.email !== undefined
            ? { email: patch.email ? patch.email.toLowerCase() : null }
            : {}),
          ...(patch.passwordHash !== undefined
            ? { passwordHash: patch.passwordHash }
            : {}),
          ...(patch.status !== undefined ? { status: patch.status } : {}),
          ...(patch.isEmailVerified !== undefined
            ? { isEmailVerified: patch.isEmailVerified }
            : {}),
          ...(patch.isMobileVerified !== undefined
            ? { isMobileVerified: patch.isMobileVerified }
            : {}),
          ...(patch.lastLoginAt !== undefined
            ? { lastLoginAt: patch.lastLoginAt }
            : {}),
        },
      })) as UserRecord;
    } catch (error) {
      assertWritable(error, { email: patch.email });
    }
  }

  async findUserByLinkedAccount(
    provider: 'GOOGLE',
    providerAccountId: string,
  ): Promise<UserRecord | null> {
    const linked = await this.client.linkedAccount.findUnique({
      where: { provider_providerAccountId: { provider, providerAccountId } },
    });
    if (!linked) return null;
    return (await this.client.user.findUnique({
      where: { id: linked.userId },
    })) as UserRecord | null;
  }

  async upsertLinkedAccount(input: {
    userId: string;
    provider: 'GOOGLE';
    providerAccountId: string;
  }): Promise<LinkedAccountRecord> {
    return (await this.client.linkedAccount.upsert({
      where: { userId: input.userId },
      create: {
        id: createId('lnk'),
        userId: input.userId,
        provider: input.provider,
        providerAccountId: input.providerAccountId,
      },
      update: {
        provider: input.provider,
        providerAccountId: input.providerAccountId,
      },
    })) as LinkedAccountRecord;
  }
}
