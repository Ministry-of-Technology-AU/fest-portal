import prisma from './prisma';
import { sendUserCreatedEmail } from './mail';

/**
 * This script will:
 * 1. Find all users in the database.
 * 2. Mark users 1-88 as 'emailSent: true' (based on logs).
 * 3. Offer to resend emails to those who are at 'false'.
 */

async function main() {
  const users = await prisma.user.findMany({
    orderBy: { lastStatusTime: 'asc' }
  });

  const firstFailedEmail = 'reachsameergoyal@gmail.com';
  let firstFailedIndex = users.findIndex(u => u.email === firstFailedEmail);

  if (firstFailedIndex === -1) {
    console.log('Could not find Sameer Goyal in the database.');
    // Fallback: Just ask the user or show the list
    firstFailedIndex = 88; // Default estimate
  }

  console.log(`Identified failure starting at index ${firstFailedIndex} (User: ${users[firstFailedIndex]?.name})`);

  // 1. Mark successful ones
  console.log('Marking previous users as "sent"...');
  const successfulUsers = users.slice(0, firstFailedIndex);
  await prisma.user.updateMany({
    where: {
      id: { in: successfulUsers.map(u => u.id) }
    },
    data: { emailSent: true }
  });
  console.log(`Updated status for ${successfulUsers.length} users.`);

  // 2. Identify pending ones
  const pendingUsers = await prisma.user.findMany({
    where: { emailSent: false }
  });

  console.log(`\nFound ${pendingUsers.length} users who need their emails sent:`);
  pendingUsers.forEach((u, i) => console.log(`${i+1}. ${u.name} (${u.email})`));

  console.log('\nStarting resend process in 5 seconds...');
  await new Promise(r => setTimeout(r, 5000));

  const festUser = await prisma.fest_user.findFirst();

  for (const user of pendingUsers) {
    console.log(`Sending email to ${user.name} (${user.email})...`);
    try {
      const res = await sendUserCreatedEmail(user.email, user.name, user.id, festUser?.username || 'Fest');
      if (res.success) {
        await prisma.user.update({
          where: { id: user.id },
          data: { emailSent: true }
        });
        console.log('   ✅ Sent and updated status.');
      } else {
        console.error('   ❌ Failed:', res.error);
        console.log('Stopping to avoid more rate limiting. Please wait a few minutes before running again.');
        break;
      }
    } catch (err) {
      console.error('   ❌ Error:', err);
      break;
    }
    // Added a longer delay to be safe
    await new Promise(r => setTimeout(r, 2000));
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
  });
