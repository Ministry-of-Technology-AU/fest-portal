import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import prisma from './prisma';
import { sendUserCreatedEmail } from './mail';
import { randomBytes } from 'crypto';

const FEST_ID = 'cmnizh7a80000l504gr6xa56f';
const CSV_PATH = path.join(process.cwd(), 'portal upload.csv');
// const CSV_PATH = path.join(process.cwd(), 'Banjaara Test.csv');


// Reusing generating logic from app/api/create-user/route.ts
async function generateUniqueId(): Promise<string> {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let attempts = 0
  while (attempts < 10) {
    let id = ''
    const bytes = randomBytes(6)
    for (let i = 0; i < 6; i++) {
      id += chars[bytes[i] % chars.length]
    }
    // Check if this ID already exists
    const existing = await prisma.user.findUnique({ where: { id } })
    if (!existing) return id
    attempts++
  }
  throw new Error('Failed to generate unique ID after 10 attempts')
}

interface CSVRecord {
  Name: string;
  'Phone Number': string;
  'Email ID': string;
  College: string;
  Competitions: string;
  isDone?: string | boolean;
}

async function migrate() {
  console.log('Starting migration...');

  // 1. Fetch events to create a map
  const events = await prisma.event.findMany({
    where: { festId: FEST_ID }
  });
  const eventMap: Record<string, number> = {};
  events.forEach(e => {
    eventMap[e.name.trim().toLowerCase()] = e.id;
  });

  // Fetch fest user once upfront
  const festUser = await prisma.fest_user.findUnique({ where: { id: FEST_ID } });

  // 2. Read and parse CSV
  const fileContent = fs.readFileSync(CSV_PATH, 'utf-8');
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
  }) as CSVRecord[];

  const processedRecords: CSVRecord[] = [];
  let count = 0;

  for (const record of records) {
    // Skip if already marked done in CSV
    if (record.isDone === 'true' || record.isDone === true || record.isDone === 'TRUE') {
      processedRecords.push(record);
      continue;
    }

    // Skip Ashoka University students
    if (record.College && record.College.toLowerCase().includes('ashoka')) {
      console.log(`   Skipping ${record.Name} (Ashoka University)`);
      processedRecords.push(record);
      continue;
    }

    try {
      console.log(`[${++count}] Processing user: ${record.Name} (${record['Email ID']})`);

      // Safe re-run: check if user already exists in DB by email before doing anything
      const existing = await prisma.user.findFirst({ where: { email: record['Email ID'], festId: FEST_ID } });
      if (existing) {
        console.log(`   -> Already in DB (ID: ${existing.id}), skipping insert.`);
        record.isDone = 'true';
        processedRecords.push(record);
        continue;
      }

      // Generate a unique 6-character alphanumeric ID
      const userId = await generateUniqueId();

      // Map competitions to event IDs
      const competitionsStr = record.Competitions || '';
      const competitions = competitionsStr.split(',').map((s: string) => s.trim());
      const eventIdsToConnect = competitions
        .map((name: string) => eventMap[name.toLowerCase()])
        .filter((id: number | undefined) => id !== undefined)
        .map((id: number) => ({ id }));

      const now = new Date();

      // 1. Create user + initial status trail in a transaction
      await prisma.$transaction([
        prisma.user.create({
          data: {
            id: userId,
            name: record.Name,
            collegeName: record.College || 'NA',
            email: record['Email ID'],
            phoneNumber: record['Phone Number'].toString(),
            visitDates: '',
            currentStatus: 'gate_out',
            lastStatusTime: now,
            festId: FEST_ID,
            emailSent: false,
            events: { connect: eventIdsToConnect }
          }
        }),
        prisma.status_trail.create({
          data: { userId, status: 'gate_out', timestamp: now, source: 'system' }
        })
      ]);

      // 2. Send email sequentially — await before moving to next user
      console.log(`   -> Sending email to ${record['Email ID']}...`);
      const emailRes = await sendUserCreatedEmail(
        record['Email ID'],
        record.Name,
        userId,
        festUser?.username || 'Fest'
      );

      if (emailRes.success) {
        await prisma.user.update({ where: { id: userId }, data: { emailSent: true } });
        console.log(`   -> Email sent!`);
      } else {
        console.error(`   -> Email failed (user still created, can retry via resend script):`, emailRes.error);
      }

      record.isDone = 'true';
      console.log(`   -> Migrated ${record.Name} with ID ${userId}`);

      // 2500ms gap — keeps us well within Gmail's rate limits (~25 min for 600 users)
      await new Promise(resolve => setTimeout(resolve, 2500));

    } catch (error) {
      console.error(`   -> Failed to migrate ${record.Name}:`, error);
    }
    processedRecords.push(record);
  }

  // 3. Write updated CSV
  const updatedCsv = stringify(processedRecords, { header: true });
  fs.writeFileSync(CSV_PATH, updatedCsv);
  console.log(`\nMigration complete. Total new users processed: ${count}`);
}

migrate()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error('Migration script failed:', err);
    await prisma.$disconnect();
    process.exit(1);
  });
