import { PrismaClient } from "../lib/generated/prisma";

const prisma = new PrismaClient();

const FEST_ID = process.argv[2];

async function main() {
  if (!FEST_ID) {
    console.error("Usage: npx tsx scripts/reset-to-gate-out.ts <festId>");
    process.exit(1);
  }

  const users = await prisma.user.findMany({
    where: {
      festId: FEST_ID,
      NOT: { currentStatus: "gate_out" },
    },
    select: { id: true, name: true, currentStatus: true },
  });

  if (!users.length) {
    console.log("All users are already gate-out. Nothing to do.");
    return;
  }

  console.log(`Found ${users.length} users not at gate-out. Resetting...\n`);

  const now = new Date();

  await prisma.$transaction([
    prisma.user.updateMany({
      where: {
        festId: FEST_ID,
        NOT: { currentStatus: "gate_out" },
      },
      data: {
        currentStatus: "gate_out",
        lastStatusTime: now,
      },
    }),
    ...users.map((u) =>
      prisma.status_trail.create({
        data: {
          userId: u.id,
          status: "gate_out",
          timestamp: now,
          source: "system",
        },
      })
    ),
  ]);

  users.forEach((u, i) => {
    console.log(`${i + 1}. ${u.name} (${u.id}) — ${u.currentStatus} → gate_out`);
  });

  console.log(`\nDone. ${users.length} users reset to gate-out.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
