import { prisma } from '../../src/lib/prisma';

async function cleanFakeRows() {
  console.log('🧹 Cleaning demo/fake fixture rows from database...');
  const fakeUsers = await prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: 'example.com' } },
        { email: { contains: 'novatech' } },
        { name: { in: ['Alex Chen', 'Priya Sharma', 'Pooja Verma', 'NovaTech'] } },
      ],
    },
    select: { id: true, email: true },
  });

  const ids = fakeUsers.map((u) => u.id);
  console.log(`Found ${ids.length} fake users:`, fakeUsers.map(u => u.email));

  if (ids.length > 0) {
    // Delete relational records
    await prisma.userSkill.deleteMany({ where: { userId: { in: ids } } }).catch(() => {});
    await prisma.profile.deleteMany({ where: { userId: { in: ids } } }).catch(() => {});
    await prisma.experience.deleteMany({ where: { userId: { in: ids } } }).catch(() => {});
    await prisma.education.deleteMany({ where: { userId: { in: ids } } }).catch(() => {});
    await prisma.project.deleteMany({ where: { userId: { in: ids } } }).catch(() => {});
    await prisma.certification.deleteMany({ where: { userId: { in: ids } } }).catch(() => {});
    await prisma.enrollment.deleteMany({ where: { studentId: { in: ids } } }).catch(() => {});
    await prisma.coursePurchase.deleteMany({ where: { userId: { in: ids } } }).catch(() => {});
    await prisma.mentorshipBooking.deleteMany({ where: { OR: [{ studentId: { in: ids } }, { mentor: { userId: { in: ids } } }] } }).catch(() => {});
    await prisma.mentorshipRequest.deleteMany({ where: { OR: [{ studentId: { in: ids } }, { mentor: { userId: { in: ids } } }] } }).catch(() => {});
    await prisma.mentorProfile.deleteMany({ where: { userId: { in: ids } } }).catch(() => {});
    await prisma.proposal.deleteMany({ where: { professionalId: { in: ids } } }).catch(() => {});
    await prisma.application.deleteMany({ where: { applicantId: { in: ids } } }).catch(() => {});
    await prisma.jobSkill.deleteMany({ where: { job: { companyId: { in: ids } } } }).catch(() => {});
    await prisma.job.deleteMany({ where: { companyId: { in: ids } } }).catch(() => {});
    await prisma.courseModule.deleteMany({ where: { course: { instructorId: { in: ids } } } }).catch(() => {});
    await prisma.course.deleteMany({ where: { instructorId: { in: ids } } }).catch(() => {});
    await prisma.post.deleteMany({ where: { authorId: { in: ids } } }).catch(() => {});
    await prisma.comment.deleteMany({ where: { authorId: { in: ids } } }).catch(() => {});
    await prisma.like.deleteMany({ where: { userId: { in: ids } } }).catch(() => {});
    await prisma.message.deleteMany({ where: { senderId: { in: ids } } }).catch(() => {});
    await prisma.conversationParticipant.deleteMany({ where: { userId: { in: ids } } }).catch(() => {});
    await prisma.notification.deleteMany({ where: { userId: { in: ids } } }).catch(() => {});
    await prisma.session.deleteMany({ where: { userId: { in: ids } } }).catch(() => {});
    await prisma.account.deleteMany({ where: { userId: { in: ids } } }).catch(() => {});
    await prisma.paymentOrder.deleteMany({ where: { userId: { in: ids } } }).catch(() => {});
    await prisma.payment.deleteMany({ where: { userId: { in: ids } } }).catch(() => {});
    await prisma.careerRoadmap.deleteMany({ where: { userId: { in: ids } } }).catch(() => {});
    await prisma.auditLog.deleteMany({ where: { userId: { in: ids } } }).catch(() => {});
    await prisma.aIRun.deleteMany({ where: { userId: { in: ids } } }).catch(() => {});
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
  }

  const remaining = await prisma.user.count({
    where: {
      OR: [
        { email: { contains: 'example.com' } },
        { email: { contains: 'novatech' } },
        { name: { in: ['Alex Chen', 'Priya Sharma', 'Pooja Verma', 'NovaTech'] } },
      ],
    },
  });

  console.log(`✅ Cleaned. Remaining fake user rows: ${remaining}`);
}

cleanFakeRows()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
