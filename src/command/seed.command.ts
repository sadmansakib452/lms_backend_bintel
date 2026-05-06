// external imports
import { Command, CommandRunner } from 'nest-commander';
import * as bcrypt from 'bcrypt';
// internal imports
import appConfig from '../config/app.config';
import { UserRepository } from '../common/repository/user/user.repository';
import { PrismaService } from '../prisma/prisma.service';

@Command({
  name: 'seed',
  description: 'prisma db seed',
  options: { isDefault: true },
})
export class SeedCommand extends CommandRunner {
  private static readonly CORE_ROLE_NAMES = {
    superAdmin: 'su_admin',
    admin: 'admin',
    student: 'student',
  } as const;

  constructor(
    private readonly prisma: PrismaService,
    private readonly userRepository: UserRepository,
  ) {
    super();
  }

  private log(message: string) {
    console.log(message);
  }

  private abort(message: string): never {
    throw new Error(message);
  }

  private formatMs(ms: number) {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  }

  async run(): Promise<void> {
    await this.seed();
  }

  async seed() {
    try {
      const startedAt = Date.now();

      this.log('🌱 Seed starting...');
      this.log(`🧩 Prisma Env: ${process.env.PRISMA_ENV}`);

      const desiredEmail = appConfig().defaultUser.system.email;
      const desiredUsername = appConfig().defaultUser.system.username;

      this.log(`🧾 Desired super admin: email="${desiredEmail}", username="${desiredUsername}"`);

      // begin transaaction
      await this.prisma.$transaction(async () => {
        const roleIds = await this.roleSeed();
        await this.permissionSeed();
        await this.userSeed(roleIds.superAdminRoleId);
        await this.permissionRoleSeed(roleIds);
      });

      this.log(`🎉 Seed done in ${this.formatMs(Date.now() - startedAt)}.`);
    } catch (error) {
      throw error;
    }
  }

  //---- user section ----
  async userSeed(superAdminRoleId: string) {
    this.log('🔐 Seeding super admin...');

    const desiredEmail = appConfig().defaultUser.system.email;
    const desiredUsername = appConfig().defaultUser.system.username;
    const desiredPassword = appConfig().defaultUser.system.password;

    if (!desiredEmail || !desiredPassword) {
      this.abort(
        '⚠️ Missing SYSTEM_EMAIL or SYSTEM_PASSWORD in env. Aborting seed.',
      );
    }

    const currentSuRoleUser = await this.prisma.roleUser.findFirst({
      where: { role_id: superAdminRoleId },
      include: { user: true },
    });

    const currentSuUser = currentSuRoleUser?.user ?? null;

    if (currentSuUser) {
      this.log(
        `👑 Current super admin: userId="${currentSuUser.id}", email="${currentSuUser.email}"`,
      );
    } else {
      this.log(
        `⚪ Current super admin: none found (role="${SeedCommand.CORE_ROLE_NAMES.superAdmin}")`,
      );
    }

    const emailOwner = await this.userRepository.getUserByEmail(desiredEmail);

    // If desired email belongs to someone else (not the current super admin), abort.
    if (currentSuUser && emailOwner && emailOwner.id !== currentSuUser.id) {
      this.abort(
        `⚠️ Refusing to promote existing user "${desiredEmail}" to super admin. ` +
          `That email already belongs to another user (userId="${emailOwner.id}"). ` +
          `Please fix SYSTEM_EMAIL or update the existing super admin instead.`,
      );
    }

    // If we have a current super admin, we "rename/update" that account to match env.
    if (currentSuUser) {
      const passwordHash = await bcrypt.hash(
        desiredPassword,
        appConfig().security.salt,
      );

      const data: any = {
        type: 'su_admin',
        password: passwordHash,
        email_verified_at: new Date(),
        approved_at: new Date(),
      };

      if (desiredEmail && desiredEmail !== currentSuUser.email) {
        data.email = desiredEmail;
        this.log(
          `✏️ Updating super admin email: "${currentSuUser.email}" → "${desiredEmail}"`,
        );
      }

      if (desiredUsername && desiredUsername !== currentSuUser.username) {
        const usernameOwner = await this.prisma.user.findFirst({
          where: {
            username: desiredUsername,
            NOT: { id: currentSuUser.id },
          },
          select: { id: true, email: true, username: true },
        });

        if (usernameOwner) {
          this.log(
            `⚠️ Username "${desiredUsername}" is already used by userId="${usernameOwner.id}". Skipping username update.`,
          );
        } else {
          data.username = desiredUsername;
          this.log(
            `✏️ Updating super admin username: "${currentSuUser.username}" → "${desiredUsername}"`,
          );
        }
      }

      await this.prisma.user.update({
        where: { id: currentSuUser.id },
        data,
      });

      this.log('✅ Super admin updated from env.');
      return;
    }

    // No current super admin exists: create or promote based on email existence.
    if (emailOwner) {
      this.abort(
        `⚠️ No existing super admin found, but SYSTEM_EMAIL "${desiredEmail}" already exists (userId="${emailOwner.id}"). ` +
          `For safety, this seed will not promote an existing user to super admin automatically.`,
      );
    }

    // Create new super admin (fresh DB scenario)
    const usernameOwner = desiredUsername
      ? await this.prisma.user.findFirst({
          where: { username: desiredUsername },
          select: { id: true, email: true, username: true },
        })
      : null;

    if (usernameOwner) {
      this.abort(
        `⚠️ Cannot create super admin: SYSTEM_USERNAME "${desiredUsername}" is already used by userId="${usernameOwner.id}".`,
      );
    }

    const created = await this.userRepository.createSuAdminUser({
      username: desiredUsername,
      email: desiredEmail,
      password: desiredPassword,
    });

    await this.prisma.user.update({
      where: { id: created.id },
      data: {
        email_verified_at: new Date(),
        approved_at: new Date(),
      },
    });

    await this.prisma.roleUser.create({
      data: {
        user_id: created.id,
        role_id: superAdminRoleId,
      },
    });

    this.log(`🆕 Created new super admin userId="${created.id}".`);
  }

  async permissionSeed() {
    this.log('🧩 Seeding permissions...');
    const deprecatedSubjects = ['SystemTenant', 'projects', 'tasks', 'comments'];
    const removed = await this.prisma.permission.deleteMany({
      where: { subject: { in: deprecatedSubjects } },
    });
    this.log(`🧹 Removed deprecated permissions: ${removed.count}.`);

    const actions = ['read', 'create', 'update', 'delete', 'manage'];
    const subjects = [
      'users',
      'roles',
      'permissions',
      'courses',
      'lessons',
      'enrollments',
      'assignments',
      'submissions',
      'reports',
    ];

    const permissionPairs: Array<{
      action: string;
      subject: string;
      title: string;
    }> = [];

    for (const subject of subjects) {
      for (const action of actions) {
        permissionPairs.push({
          action,
          subject,
          title: `${subject}_${action}`,
        });
      }
    }

    // No hardcoded IDs: resolve by business key (action+subject), create only missing.
    const existing = await this.prisma.permission.findMany({
      where: { subject: { in: subjects } },
      select: { id: true, action: true, subject: true },
    });
    const existingKeys = new Set(
      existing.map((permission) => `${permission.action}:${permission.subject}`),
    );

    let createdCount = 0;
    for (const permission of permissionPairs) {
      const key = `${permission.action}:${permission.subject}`;
      if (!existingKeys.has(key)) {
        await this.prisma.permission.create({
          data: {
            action: permission.action,
            subject: permission.subject,
            title: permission.title,
          },
        });
        existingKeys.add(key);
        createdCount++;
      }
    }

    this.log(`✅ Permissions ready (created: ${createdCount}).`);
  }

  async permissionRoleSeed(roleIds: {
    superAdminRoleId: string;
    adminRoleId: string;
    studentRoleId: string;
  }) {
    this.log('🔗 Seeding role-permission relations...');
    const allPermissions = await this.prisma.permission.findMany();

    // Canonicalize duplicate action:subject entries and keep one permission per key.
    const canonicalByActionSubject = new Map<string, (typeof allPermissions)[number]>();
    for (const permission of allPermissions) {
      const key = `${permission.action}:${permission.subject}`;
      if (!canonicalByActionSubject.has(key)) {
        canonicalByActionSubject.set(key, permission);
      }
    }

    const byActionSubject = new Map<string, string>();
    for (const permission of canonicalByActionSubject.values()) {
      byActionSubject.set(
        `${permission.action}:${permission.subject}`,
        permission.id,
      );
    }

    const adminGrants = [
      ['manage', 'users'],
      ['read', 'roles'],
      ['read', 'permissions'],
      ['manage', 'courses'],
      ['manage', 'lessons'],
      ['manage', 'enrollments'],
      ['manage', 'assignments'],
      ['manage', 'submissions'],
      ['read', 'reports'],
    ];

    const studentGrants = [
      ['read', 'courses'],
      ['read', 'lessons'],
      ['read', 'assignments'],
      ['create', 'submissions'],
      ['read', 'submissions'],
    ];

    const allRelations: Array<{ role_id: string; permission_id: string }> = [];

    // Super admin => all canonical permissions
    for (const permission of canonicalByActionSubject.values()) {
      allRelations.push({
        role_id: roleIds.superAdminRoleId,
        permission_id: permission.id,
      });
    }

    // Admin and student => specific grants
    for (const [action, subject] of adminGrants) {
      const permissionId = byActionSubject.get(`${action}:${subject}`);
      if (permissionId) {
        allRelations.push({
          role_id: roleIds.adminRoleId,
          permission_id: permissionId,
        });
      }
    }

    for (const [action, subject] of studentGrants) {
      const permissionId = byActionSubject.get(`${action}:${subject}`);
      if (permissionId) {
        allRelations.push({
          role_id: roleIds.studentRoleId,
          permission_id: permissionId,
        });
      }
    }

    const created = await this.prisma.permissionRole.createMany({
      data: allRelations,
      skipDuplicates: true,
    });
    this.log(
      `✅ Role-permission relations ready (created: ${created.count}).`,
    );
  }

  private async ensureRole(name: string, title: string) {
    const existing = await this.prisma.role.findFirst({
      where: { name, deleted_at: null },
      select: { id: true, name: true, title: true },
      orderBy: { created_at: 'asc' },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.role.create({
      data: { name, title },
      select: { id: true, name: true, title: true },
    });
  }

  async roleSeed(): Promise<{
    superAdminRoleId: string;
    adminRoleId: string;
    studentRoleId: string;
  }> {
    this.log('📦 Seeding roles...');

    const superAdmin = await this.ensureRole(
      SeedCommand.CORE_ROLE_NAMES.superAdmin,
      'Super Admin',
    );
    const admin = await this.ensureRole(SeedCommand.CORE_ROLE_NAMES.admin, 'Admin');
    const student = await this.ensureRole(
      SeedCommand.CORE_ROLE_NAMES.student,
      'Student',
    );

    this.log(
      `✅ Roles ready (resolved IDs: su_admin=${superAdmin.id}, admin=${admin.id}, student=${student.id}).`,
    );

    return {
      superAdminRoleId: superAdmin.id,
      adminRoleId: admin.id,
      studentRoleId: student.id,
    };
  }
}
