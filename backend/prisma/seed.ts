// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { 
  USER_ROLES, 
  USER_STATUS, 
  FAMILY_MEMBER_STATUS,
  INVITATION_STATUS,
  TRANSACTION_TYPES,
  TRANSACTION_STATUS,
  PAYMENT_METHODS,
  RECHARGE_TYPES,
  NOTIFICATION_TYPES,
  OTP_PURPOSES,
  LIMIT_REQUEST_DURATION,
  LIMITS
} from '../src/utils/constants';
import { generateTxnId, generateInviteCode } from '../src/utils/helpers';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');
  console.log(`📊 Database type: ${process.env.DATABASE_URL?.split(':')[0] || 'unknown'}`);

  // ========== CLEAN EXISTING DATA (Optional) ==========
  const shouldClean = process.argv.includes('--clean');
  if (shouldClean) {
    console.log('🧹 Cleaning existing data...');
    await prisma.$transaction([
      prisma.oTP.deleteMany(),
      prisma.notification.deleteMany(),
      prisma.recharge.deleteMany(),
      prisma.transaction.deleteMany(),
      prisma.limitRequest.deleteMany(),
      prisma.invitation.deleteMany(),
      prisma.familyMember.deleteMany(),
      prisma.bankAccount.deleteMany(),
      prisma.wallet.deleteMany(),
      prisma.user.deleteMany(),
    ]);
    console.log('✅ Database cleaned');
  }

  // ========== CREATE PRIMARY USER ==========
  const hashedPin = await bcrypt.hash('1234', 10);
  
  const primary = await prisma.user.upsert({
    where: { phone: '9876543210' },
    update: {
      name: 'Rahul Sharma',
      email: 'rahul@example.com',
      role: USER_ROLES.PRIMARY,
      status: USER_STATUS.ACTIVE,
      pin: hashedPin,
      updatedAt: new Date(),
    },
    create: {
      phone: '9876543210',
      name: 'Rahul Sharma',
      email: 'rahul@example.com',
      role: USER_ROLES.PRIMARY,
      status: USER_STATUS.ACTIVE,
      pin: hashedPin,
      wallet: { create: { balance: 5000 } },
    },
  });
  console.log('✅ Primary user ready:', primary.phone, '(ID:', primary.id.slice(0, 8) + '...)');

  // ========== CREATE BANK ACCOUNTS ==========
  const banks = [
    {
      bankName: 'Dummy Bank of India',
      accountNumber: '1234567890',
      ifscCode: 'DBIN0001234',
      accountHolder: 'Rahul Sharma',
      balance: 50000,
      isDefault: true,
      isVerified: true,
    },
    {
      bankName: 'Dummy National Bank',
      accountNumber: '0987654321',
      ifscCode: 'DNBN0005678',
      accountHolder: 'Rahul Sharma',
      balance: 25000,
      isDefault: false,
      isVerified: true,
    },
    {
      bankName: 'Dummy Co-operative Bank',
      accountNumber: '1122334455',
      ifscCode: 'DCBN0009012',
      accountHolder: 'Rahul Sharma',
      balance: 10000,
      isDefault: false,
      isVerified: true,
    },
  ];

  let bankCount = 0;
  for (const bank of banks) {
    try {
      await prisma.bankAccount.upsert({
        where: {
          accountNumber_ifscCode: {
            accountNumber: bank.accountNumber,
            ifscCode: bank.ifscCode,
          },
        },
        update: { ...bank, userId: primary.id, updatedAt: new Date() },
        create: { ...bank, userId: primary.id },
      });
      bankCount++;
    } catch (error) {
      console.log(`⚠️ Could not create bank ${bank.bankName}:`, error instanceof Error ? error.message : String(error));
    }
  }
  console.log(`✅ ${bankCount} dummy banks ready`);

  // ========== CREATE LINKED USERS ==========
  const linkedUsers = [
    { phone: '9876543211', name: 'Riya Sharma', relationship: 'Daughter' },
    { phone: '9876543212', name: 'Raj Sharma', relationship: 'Son' },
    { phone: '9876543213', name: 'Priya Sharma', relationship: 'Wife' },
  ];

  for (const user of linkedUsers) {
    const linked = await prisma.user.upsert({
      where: { phone: user.phone },
      update: {
        name: user.name,
        role: USER_ROLES.LINKED,
        status: USER_STATUS.ACTIVE,
        pin: hashedPin,
        updatedAt: new Date(),
      },
      create: {
        phone: user.phone,
        name: user.name,
        role: USER_ROLES.LINKED,
        status: USER_STATUS.ACTIVE,
        pin: hashedPin,
        wallet: { create: { balance: Math.floor(Math.random() * 1000) } },
      },
    });
    console.log(`✅ Linked user ready: ${linked.name} (${linked.phone})`);

    const existingFamily = await prisma.familyMember.findFirst({
      where: { primaryId: primary.id, linkedId: linked.id },
    });

    if (!existingFamily) {
      await prisma.familyMember.create({
        data: {
          primaryId: primary.id,
          linkedId: linked.id,
          relationship: user.relationship,
          dailyLimit: LIMITS.DEFAULT_DAILY,
          monthlyLimit: LIMITS.DEFAULT_MONTHLY,
          perTransactionLimit: LIMITS.DEFAULT_PER_TXN,
          dailySpent: Math.floor(Math.random() * 300),
          monthlySpent: Math.floor(Math.random() * 2000),
          status: FAMILY_MEMBER_STATUS.ACTIVE,
          permissions: JSON.stringify({
            sendMoney: true,
            scanPay: true,
            recharge: true,
            viewHistory: true,
          }),
        },
      });
      console.log(`   👨‍👩‍👧 Family relationship created (${user.relationship})`);
    }
  }

  // ========== CREATE SAMPLE TRANSACTIONS ==========
  const transactionTypes = Object.values(TRANSACTION_TYPES);
  const statuses = Object.values(TRANSACTION_STATUS);
  
  let transactionCount = 0;
  
  const linkedUsersList = await prisma.user.findMany({
    where: { role: USER_ROLES.LINKED },
  });

  for (let i = 0; i < 20; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    
    const type = transactionTypes[Math.floor(Math.random() * transactionTypes.length)]!;
    const status = statuses[Math.floor(Math.random() * statuses.length)]!;
    const amount = Math.floor(Math.random() * 1000) + 100;
    
    if (linkedUsersList.length === 0) break;
    
    const randomLinkedUser = linkedUsersList[Math.floor(Math.random() * linkedUsersList.length)]!;
    const sender = Math.random() > 0.5 ? primary : randomLinkedUser;
    const receiver = sender.id === primary.id ? randomLinkedUser : primary;
    
    try {
      await prisma.transaction.create({
        data: {
          transactionId: generateTxnId('TXN'),
          amount,
          type,
          status,
          senderId: sender.id,
          receiverId: receiver.id,
          description: `Sample ${type.toLowerCase()} transaction`,
          paymentMethod: PAYMENT_METHODS.WALLET,
          createdAt: date,
          completedAt: status === TRANSACTION_STATUS.SUCCESS ? date : null,
          metadata: JSON.stringify({ sample: true, random: Math.random() }),
        },
      });
      transactionCount++;
    } catch (error) {
      // Skip duplicate transaction IDs
      console.log(`⚠️ Transaction creation skipped:`, error instanceof Error ? error.message : String(error));
    }
  }
  console.log(`✅ ${transactionCount} sample transactions created`);

  // ========== CREATE INVITATIONS ==========
  const invitations = [
    {
      inviteCode: generateInviteCode(),
      invitedPhone: '9999999999',
      relationship: 'Cousin',
      dailyLimit: 300,
      monthlyLimit: 3000,
      perTransactionLimit: 150,
      message: 'Join our family account!',
    },
    {
      inviteCode: generateInviteCode(),
      invitedPhone: '8888888888',
      relationship: 'Nephew',
      dailyLimit: 200,
      monthlyLimit: 2000,
      perTransactionLimit: 100,
      message: 'Welcome to the family!',
    },
  ];

  let invitationCount = 0;
  for (const invite of invitations) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    try {
      await prisma.invitation.upsert({
        where: { inviteCode: invite.inviteCode },
        update: { ...invite, primaryId: primary.id, expiresAt, updatedAt: new Date() },
        create: {
          ...invite,
          primaryId: primary.id,
          status: INVITATION_STATUS.PENDING,
          expiresAt,
        },
      });
      invitationCount++;
    } catch (error) {
      console.log(`⚠️ Could not create invitation:`, error instanceof Error ? error.message : String(error));
    }
  }
  console.log(`✅ ${invitationCount} sample invitations created`);

  // ========== CREATE NOTIFICATIONS ==========
  const notificationTypes = [
    { type: NOTIFICATION_TYPES.WELCOME, title: 'Welcome to SnapPay!', message: 'Your account has been created successfully.' },
    { type: NOTIFICATION_TYPES.PAYMENT_SUCCESS, title: 'Payment Successful', message: 'Your payment of ₹500 was successful.' },
    { type: NOTIFICATION_TYPES.LIMIT_ALERT, title: 'Limit Alert', message: 'You have used 80% of your daily limit.' },
    { type: NOTIFICATION_TYPES.FAMILY_JOINED, title: 'Family Member Joined', message: 'Riya has joined your family.' },
  ];

  let notificationCount = 0;
  for (const notif of notificationTypes) {
    try {
      await prisma.notification.create({
        data: {
          userId: primary.id,
          type: notif.type,
          title: notif.title,
          message: notif.message,
          isRead: Math.random() > 0.5,
          data: JSON.stringify({ sample: true }),
        },
      });
      notificationCount++;
    } catch (error) {
      console.log(`⚠️ Could not create notification:`, error instanceof Error ? error.message : String(error));
    }
  }
  console.log(`✅ ${notificationCount} sample notifications created`);

  // ========== CREATE OTPs ==========
  const otps = [
    { phone: '9876543210', purpose: OTP_PURPOSES.LOGIN, code: '123456' },
    { phone: '9876543211', purpose: OTP_PURPOSES.LOGIN, code: '123456' },
    { phone: '9876543212', purpose: OTP_PURPOSES.LOGIN, code: '123456' },
    { phone: '9876543213', purpose: OTP_PURPOSES.LOGIN, code: '123456' },
  ];

  for (const otp of otps) {
    await prisma.oTP.upsert({
      where: { id: `seed-${otp.phone}-${otp.purpose}` },
      update: {},
      create: {
        phone: otp.phone,
        code: otp.code,
        purpose: otp.purpose,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        isUsed: false,
      },
    });
  }
  console.log(`✅ Sample OTPs created (use 123456 for testing)`);

  // ========== SUMMARY ==========
  const stats = await prisma.$transaction([
    prisma.user.count(),
    prisma.user.count({ where: { role: USER_ROLES.PRIMARY } }),
    prisma.user.count({ where: { role: USER_ROLES.LINKED } }),
    prisma.familyMember.count(),
    prisma.bankAccount.count(),
    prisma.transaction.count(),
    prisma.wallet.aggregate({ _sum: { balance: true } }),
  ]);

  console.log('\n' + '='.repeat(60));
  console.log('🎉 SEEDING COMPLETE!');
  console.log('='.repeat(60));
  console.log('\n📊 DATABASE STATISTICS:');
  console.log(`   • Total Users: ${stats[0]}`);
  console.log(`   • Primary Users: ${stats[1]}`);
  console.log(`   • Linked Users: ${stats[2]}`);
  console.log(`   • Family Relationships: ${stats[3]}`);
  console.log(`   • Bank Accounts: ${stats[4]}`);
  console.log(`   • Transactions: ${stats[5]}`);
  console.log(`   • Total Wallet Balance: ₹${stats[6]._sum.balance || 0}`);

  console.log('\n📱 TEST CREDENTIALS:');
  console.log('   Primary Account:');
  console.log(`   📞 Phone: 9876543210`);
  console.log(`   👤 Name: Rahul Sharma`);
  console.log(`   🔑 PIN: 1234`);
  console.log(`   🔐 OTP: 123456`);
  console.log(`   💰 Wallet: ₹5000`);
  
  console.log('\n   Linked Accounts:');
  linkedUsers.forEach((user, index) => {
    console.log(`   ${index + 1}. 📞 ${user.phone} - ${user.name} (${user.relationship})`);
  });
  
  console.log('\n🏦 BANK ACCOUNTS:');
  console.log(`   • Dummy Bank of India (Default) - ₹50,000`);
  console.log(`   • Dummy National Bank - ₹25,000`);
  console.log(`   • Dummy Co-operative Bank - ₹10,000`);
  
  console.log('\n👨‍👩‍👧 FAMILY:');
  linkedUsers.forEach(user => {
    console.log(`   • Rahul Sharma → ${user.name} (${user.relationship})`);
  });
  console.log(`   • Daily Limit: ₹${LIMITS.DEFAULT_DAILY} | Monthly Limit: ₹${LIMITS.DEFAULT_MONTHLY} | Per TXN: ₹${LIMITS.DEFAULT_PER_TXN}`);
  
  console.log('\n🔗 INVITATION CODES:');
  console.log(`   • ${invitations[0].inviteCode} - For Cousin (expires in 7 days)`);
  console.log(`   • ${invitations[1].inviteCode} - For Nephew (expires in 7 days)`);
  
  console.log('='.repeat(60));
}

main()
  .catch(e => {
    console.error('\n❌ Seeding failed:');
    console.error('   ', e instanceof Error ? e.message : String(e));
    if (e instanceof Error && e.stack) {
      console.error('\nStack trace:', e.stack);
    }
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('\n👋 Database connection closed');
  });