import { PrismaClient, GlobalRole, MemberRole, ProjectStatus, TaskStatus, Priority } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo users
  const adminPassword = await bcrypt.hash('Admin123!', 12);
  const memberPassword = await bcrypt.hash('Member123!', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@orbitflow.dev' },
    update: {},
    create: {
      name: 'Alex Rivera',
      email: 'admin@orbitflow.dev',
      passwordHash: adminPassword,
      globalRole: GlobalRole.ADMIN,
      bio: 'Platform Administrator & Lead Engineer',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    },
  });

  const member1 = await prisma.user.upsert({
    where: { email: 'sarah@orbitflow.dev' },
    update: {},
    create: {
      name: 'Sarah Chen',
      email: 'sarah@orbitflow.dev',
      passwordHash: memberPassword,
      globalRole: GlobalRole.MEMBER,
      bio: 'Full-Stack Developer',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    },
  });

  const member2 = await prisma.user.upsert({
    where: { email: 'james@orbitflow.dev' },
    update: {},
    create: {
      name: 'James Wilson',
      email: 'james@orbitflow.dev',
      passwordHash: memberPassword,
      globalRole: GlobalRole.MEMBER,
      bio: 'Product Designer',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James',
    },
  });

  // Create a demo project
  const project = await prisma.project.create({
    data: {
      name: 'OrbitFlow v2 Launch',
      status: ProjectStatus.ACTIVE,
      emoji: '🚀',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      ownerId: admin.id,
    },
  });

  // Add members to project
  await prisma.projectMember.createMany({
    data: [
      { projectId: project.id, userId: admin.id, role: MemberRole.ADMIN },
      { projectId: project.id, userId: member1.id, role: MemberRole.MEMBER },
      { projectId: project.id, userId: member2.id, role: MemberRole.MEMBER },
    ],
    skipDuplicates: true,
  });

  // Create demo tasks
  const tasks = [
    { title: 'Design new dashboard UI', status: TaskStatus.COMPLETED, priority: Priority.HIGH, assigneeId: member2.id, position: 0 },
    { title: 'Implement authentication system', status: TaskStatus.COMPLETED, priority: Priority.CRITICAL, assigneeId: member1.id, position: 1 },
    { title: 'Set up CI/CD pipeline', status: TaskStatus.IN_PROGRESS, priority: Priority.HIGH, assigneeId: admin.id, position: 2 },
    { title: 'Write API documentation', status: TaskStatus.IN_PROGRESS, priority: Priority.MEDIUM, assigneeId: member1.id, position: 3 },
    { title: 'Performance optimization', status: TaskStatus.TODO, priority: Priority.HIGH, assigneeId: member1.id, position: 4 },
    { title: 'User onboarding flow', status: TaskStatus.REVIEW, priority: Priority.MEDIUM, assigneeId: member2.id, position: 5 },
    { title: 'Mobile responsive design', status: TaskStatus.TODO, priority: Priority.MEDIUM, assigneeId: member2.id, position: 6 },
    { title: 'Security audit', status: TaskStatus.TODO, priority: Priority.CRITICAL, assigneeId: admin.id, position: 7 },
    { title: 'Load testing', status: TaskStatus.TODO, priority: Priority.LOW, assigneeId: null, position: 8 },
    { title: 'Deploy to production', status: TaskStatus.TODO, priority: Priority.CRITICAL, assigneeId: admin.id, position: 9, dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
  ];

  for (const task of tasks) {
    await prisma.task.create({
      data: {
        ...task,
        projectId: project.id,
        creatorId: admin.id,
        description: `Detailed task description for: ${task.title}. This includes all requirements, acceptance criteria, and implementation notes.`,
      },
    });
  }

  // Create a second project
  const project2 = await prisma.project.create({
    data: {
      name: 'Mobile App Development',
      status: ProjectStatus.ACTIVE,
      emoji: '📱',
      dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      ownerId: member1.id,
    },
  });

  await prisma.projectMember.createMany({
    data: [
      { projectId: project2.id, userId: member1.id, role: MemberRole.ADMIN },
      { projectId: project2.id, userId: admin.id, role: MemberRole.MEMBER },
    ],
    skipDuplicates: true,
  });

  await prisma.task.createMany({
    data: [
      { title: 'Set up React Native project', status: TaskStatus.COMPLETED, priority: Priority.HIGH, projectId: project2.id, creatorId: member1.id, assigneeId: member1.id, position: 0 },
      { title: 'Design mobile UI kit', status: TaskStatus.IN_PROGRESS, priority: Priority.HIGH, projectId: project2.id, creatorId: member1.id, assigneeId: member2.id, position: 1 },
      { title: 'Implement push notifications', status: TaskStatus.TODO, priority: Priority.MEDIUM, projectId: project2.id, creatorId: member1.id, assigneeId: null, position: 2 },
    ],
  });

  console.log('✅ Seed complete!');
  console.log('\n📧 Demo Credentials:');
  console.log('   Admin: admin@orbitflow.dev / Admin123!');
  console.log('   Member: sarah@orbitflow.dev / Member123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
