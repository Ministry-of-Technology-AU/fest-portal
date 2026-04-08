import prisma from './prisma';

async function fixData() {
  const users = await prisma.user.findMany({
      orderBy: { lastStatusTime: 'asc' }
  });

  const firstFailedEmail = 'reachsameergoyal@gmail.com';
  const firstFailedIndex = users.findIndex(u => u.email === firstFailedEmail);

  if (firstFailedIndex === -1) {
    console.error('Could not find Sameer Goyal in the database. Please check the email address.');
    return;
  }

  console.log(`Found ${users.length} total users.`);
  console.log(`Sameer Goyal is at index ${firstFailedIndex}.`);
  
  const successfulOnes = users.slice(0, firstFailedIndex);
  const failedOnes = users.slice(firstFailedIndex);

  console.log(`Marking ${successfulOnes.length} users as "Email Sent"...`);
  
  await prisma.user.updateMany({
    where: {
      id: { in: successfulOnes.map(u => u.id) }
    },
    data: { emailSent: true }
  });

  console.log(`Marking ${failedOnes.length} users (Starting with Sameer) as "Email NOT Sent"...`);
  await prisma.user.updateMany({
    where: {
      id: { in: failedOnes.map(u => u.id) }
    },
    data: { emailSent: false }
  });

  console.log('\n--- Status Updated ---');
  console.log('You can now run npx ts-node lib/check-status.ts to verify.');
}

fixData()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
  });
