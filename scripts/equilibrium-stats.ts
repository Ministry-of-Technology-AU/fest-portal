import { PrismaClient } from "../lib/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  // Find equilibrium fest
  const fest = await prisma.fest_user.findFirst({
    where: { username: { contains: "equilibrium", mode: "insensitive" } },
  });

  if (!fest) {
    console.log("No fest found with username containing 'equilibrium'");
    return;
  }

  console.log(`Fest found: ${fest.username} (id: ${fest.id})\n`);

  // Total users linked to this fest
  const totalUsers = await prisma.user.count({
    where: { festId: fest.id },
  });

  // Users who have at least one reg_in in their status trail
  const registeredUsers = await prisma.user.findMany({
    where: {
      festId: fest.id,
      status_trail: {
        some: { status: "reg_in" },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      phoneNumber: true,
      currentStatus: true,
    },
    orderBy: { name: "asc" },
  });

  console.log(`Total users linked to fest: ${totalUsers}`);
  console.log(`Users who have registered in at least once: ${registeredUsers.length}\n`);

  console.log("--- Registered-in users ---");
  registeredUsers.forEach((u, i) => {
    console.log(`${i + 1}. ${u.name} | ${u.email} | ${u.phoneNumber} | status: ${u.currentStatus}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
