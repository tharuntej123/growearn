import prisma from '../prisma';

async function testConnection() {
  const count = await prisma.user.count();
  console.log('User count in database:', count);
}

testConnection()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
