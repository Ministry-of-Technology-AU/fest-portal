import { PrismaClient } from "../lib/generated/prisma";

const prisma = new PrismaClient();

const FEST_ID = process.argv[2];
const EVENT_NAME = process.argv[3];

async function main() {
  if (!FEST_ID || !EVENT_NAME) {
    console.error("Usage: npx tsx scripts/users-by-event.ts <festId> <eventName>");
    process.exit(1);
  }

  const events = await prisma.event.findMany({
    where: {
      festId: FEST_ID,
      name: { contains: EVENT_NAME, mode: "insensitive" },
    },
    include: {
      users: {
        select: {
          id: true,
          name: true,
          email: true,
          phoneNumber: true,
          collegeName: true,
          currentStatus: true,
        },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!events.length) {
    console.log(`No events found matching "${EVENT_NAME}" for fest ${FEST_ID}`);
    return;
  }

  for (const event of events) {
    console.log(`\nEvent: ${event.name} (fest: ${FEST_ID})`);
    console.log(`Total registered: ${event.users.length}`);
    console.log("---");
    event.users.forEach((u, i) => {
      console.log(`${i + 1}. ${u.name} | ${u.email} | ${u.phoneNumber} | ${u.collegeName} | ${u.currentStatus}`);
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
