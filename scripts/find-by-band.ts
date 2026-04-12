import { PrismaClient } from "../lib/generated/prisma";

const prisma = new PrismaClient();

const BAND_NUMBER = process.argv[2];

async function main() {
  if (!BAND_NUMBER) {
    console.error("Usage: npx tsx scripts/find-by-band.ts <bandNumber>");
    process.exit(1);
  }

  const users = await prisma.user.findMany({
    where: {
      additionalParams: {
        path: ["bandNumber"],
        equals: BAND_NUMBER,
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      phoneNumber: true,
      collegeName: true,
      currentStatus: true,
      additionalParams: true,
    },
    orderBy: { name: "asc" },
  });

  if (!users.length) {
    console.log(`No users found with bandNumber = "${BAND_NUMBER}"`);
    return;
  }

  console.log(`Users with bandNumber "${BAND_NUMBER}": ${users.length}\n`);
  users.forEach((u, i) => {
    const params = u.additionalParams as Record<string, unknown>;
    console.log(`${i + 1}. ${u.name} | ${u.email} | ${u.phoneNumber} | status: ${u.currentStatus}`);
    console.log(`   Band: ${params.bandNumber} | In-Desk: ${params.inDeskNumber ?? "-"} | Out-Desk: ${params.outDeskNumber ?? "-"}${params.flagNote ? ` | FLAG: ${params.flagNote}` : ""}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
