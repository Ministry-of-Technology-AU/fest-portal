import prisma from './prisma';

async function checkStatus() {
  const users = await prisma.user.findMany({
    orderBy: { lastStatusTime: 'asc' }
  });

  console.log('Total users in database:', users.length);
  console.log('\n--- User Email Sent Status ---');
  
  users.forEach((user, index) => {
    console.log(`[${index + 1}] ${user.name.padEnd(30)} | Email: ${user.email.padEnd(35)} | ID: ${user.id} | Sent: ${user.emailSent ? '✅' : '❌'}`);
  });
}

checkStatus()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
