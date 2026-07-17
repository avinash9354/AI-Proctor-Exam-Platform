import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // ─── Roles ────────────────────────────────────────────────────────
  const studentRole = await prisma.role.upsert({
    where: { name: 'student' },
    update: {},
    create: {
      name: 'student',
      permissions: {
        create: [
          { resource: 'exam', action: 'read' },
          { resource: 'session', action: 'create' },
          { resource: 'session', action: 'read' },
          { resource: 'submission', action: 'create' },
          { resource: 'submission', action: 'read' },
        ],
      },
    },
  });

  const teacherRole = await prisma.role.upsert({
    where: { name: 'teacher' },
    update: {},
    create: {
      name: 'teacher',
      permissions: {
        create: [
          { resource: 'exam', action: 'create' },
          { resource: 'exam', action: 'read' },
          { resource: 'exam', action: 'update' },
          { resource: 'question', action: 'create' },
          { resource: 'question', action: 'read' },
          { resource: 'question', action: 'update' },
          { resource: 'session', action: 'read' },
          { resource: 'report', action: 'read' },
        ],
      },
    },
  });

  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      permissions: {
        create: [
          { resource: '*', action: '*' },
        ],
      },
    },
  });

  console.log('✅ Roles created');

  // ─── Admin User ───────────────────────────────────────────────────
  const adminPasswordHash = await bcrypt.hash('Admin@1234', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@examplatform.com' },
    update: {},
    create: {
      name: 'Platform Admin',
      email: 'admin@examplatform.com',
      passwordHash: adminPasswordHash,
      roleId: adminRole.id,
    },
  });

  // ─── Teacher ──────────────────────────────────────────────────────
  const teacherPasswordHash = await bcrypt.hash('Teacher@1234', 12);
  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@examplatform.com' },
    update: {},
    create: {
      name: 'Dr. Priya Sharma',
      email: 'teacher@examplatform.com',
      passwordHash: teacherPasswordHash,
      roleId: teacherRole.id,
      department: 'Computer Science',
    },
  });

  // ─── Students ─────────────────────────────────────────────────────
  const studentPasswordHash = await bcrypt.hash('Student@1234', 12);

  const student1 = await prisma.user.upsert({
    where: { email: 'student1@examplatform.com' },
    update: {},
    create: {
      name: 'Arun Kumar',
      email: 'student1@examplatform.com',
      passwordHash: studentPasswordHash,
      roleId: studentRole.id,
      rollNumber: 'CS2024001',
      department: 'Computer Science',
      semester: 6,
    },
  });

  const student2 = await prisma.user.upsert({
    where: { email: 'student2@examplatform.com' },
    update: {},
    create: {
      name: 'Priya Patel',
      email: 'student2@examplatform.com',
      passwordHash: studentPasswordHash,
      roleId: studentRole.id,
      rollNumber: 'CS2024002',
      department: 'Computer Science',
      semester: 6,
    },
  });

  const student3 = await prisma.user.upsert({
    where: { email: 'student3@examplatform.com' },
    update: {},
    create: {
      name: 'Rahul Singh',
      email: 'student3@examplatform.com',
      passwordHash: studentPasswordHash,
      roleId: studentRole.id,
      rollNumber: 'CS2024003',
      department: 'Computer Science',
      semester: 6,
    },
  });

  console.log('✅ Users created');

  // ─── Exams ────────────────────────────────────────────────────────
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const dayAfter = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  const mcqExam = await prisma.exam.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      title: 'Data Structures & Algorithms — Midterm',
      description: 'Covers arrays, linked lists, trees, graphs, and dynamic programming.',
      type: 'mcq',
      startTime: tomorrow,
      endTime: new Date(tomorrow.getTime() + 3 * 60 * 60 * 1000),
      durationMinutes: 90,
      totalMarks: 100,
      passMarks: 40,
      isPublished: true,
      createdBy: teacher.id,
      policyConfig: JSON.stringify({
        requireCamera: true,
        requireMicrophone: true,
        requireScreenShare: true,
        requireMobileProctor: false,
        negativeMarking: true,
        negativeMarkingFraction: 0.25,
        shuffleQuestions: true,
        shuffleOptions: true,
        allowedLateJoinMinutes: 15,
        autoSubmitOnViolations: true,
        maxWarnings: 3,
        dataRetentionDays: 90,
      }),
    },
  });

  const codingExam = await prisma.exam.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      title: 'Python Programming — Final Assessment',
      description: 'Practical coding exam covering OOP, file I/O, and algorithms.',
      type: 'coding',
      startTime: dayAfter,
      endTime: new Date(dayAfter.getTime() + 3 * 60 * 60 * 1000),
      durationMinutes: 120,
      totalMarks: 200,
      passMarks: 80,
      isPublished: true,
      createdBy: teacher.id,
      policyConfig: JSON.stringify({
        requireCamera: true,
        requireMicrophone: true,
        requireScreenShare: true,
        requireMobileProctor: true,
        negativeMarking: false,
        shuffleQuestions: false,
        allowedLateJoinMinutes: 10,
        autoSubmitOnViolations: true,
        maxWarnings: 3,
        dataRetentionDays: 90,
      }),
    },
  });

  console.log('✅ Exams created');

  // ─── Questions ────────────────────────────────────────────────────
  const questions = [
    {
      examId: mcqExam.id,
      type: 'mcq',
      payload: {
        type: 'mcq',
        text: 'What is the time complexity of binary search on a sorted array of n elements?',
        options: [
          { id: 'a', text: 'O(n)', isCorrect: false },
          { id: 'b', text: 'O(log n)', isCorrect: true },
          { id: 'c', text: 'O(n log n)', isCorrect: false },
          { id: 'd', text: 'O(1)', isCorrect: false },
        ],
        explanation: 'Binary search halves the search space with each comparison, giving O(log n) complexity.',
      },
      marks: 5,
      negativeMarks: 1,
      sectionName: 'Algorithms',
      order: 1,
    },
    {
      examId: mcqExam.id,
      type: 'mcq',
      payload: {
        type: 'mcq',
        text: 'Which data structure uses LIFO (Last In, First Out) ordering?',
        options: [
          { id: 'a', text: 'Queue', isCorrect: false },
          { id: 'b', text: 'Stack', isCorrect: true },
          { id: 'c', text: 'Deque', isCorrect: false },
          { id: 'd', text: 'Priority Queue', isCorrect: false },
        ],
      },
      marks: 5,
      negativeMarks: 1,
      sectionName: 'Data Structures',
      order: 2,
    },
    {
      examId: mcqExam.id,
      type: 'mcq',
      payload: {
        type: 'mcq',
        text: 'In a min-heap, the root element is always:',
        options: [
          { id: 'a', text: 'The maximum element', isCorrect: false },
          { id: 'b', text: 'The minimum element', isCorrect: true },
          { id: 'c', text: 'A random element', isCorrect: false },
          { id: 'd', text: 'The median element', isCorrect: false },
        ],
      },
      marks: 5,
      negativeMarks: 1,
      sectionName: 'Data Structures',
      order: 3,
    },
    {
      examId: mcqExam.id,
      type: 'msq',
      payload: {
        type: 'msq',
        text: 'Which of the following are O(n log n) sorting algorithms? (Select all that apply)',
        options: [
          { id: 'a', text: 'Merge Sort', isCorrect: true },
          { id: 'b', text: 'Quick Sort (average)', isCorrect: true },
          { id: 'c', text: 'Bubble Sort', isCorrect: false },
          { id: 'd', text: 'Heap Sort', isCorrect: true },
          { id: 'e', text: 'Insertion Sort', isCorrect: false },
        ],
      },
      marks: 10,
      negativeMarks: 0,
      sectionName: 'Algorithms',
      order: 4,
    },
    {
      examId: codingExam.id,
      type: 'coding',
      payload: {
        type: 'coding',
        text: 'Write a function `two_sum(nums, target)` that returns the indices of two numbers in the array `nums` that add up to `target`. Assume exactly one solution exists.',
        starterCode: {
          python: 'def two_sum(nums, target):\n    # Your code here\n    pass\n',
          javascript: 'function twoSum(nums, target) {\n  // Your code here\n}\n',
        },
        testCases: [
          { input: '[2,7,11,15]\n9', expectedOutput: '[0, 1]', isHidden: false },
          { input: '[3,2,4]\n6', expectedOutput: '[1, 2]', isHidden: false },
          { input: '[3,3]\n6', expectedOutput: '[0, 1]', isHidden: true },
        ],
        timeLimit: 2000,
        memoryLimit: 256,
        allowedLanguages: ['python', 'javascript', 'java', 'cpp'],
      },
      marks: 30,
      negativeMarks: 0,
      sectionName: 'Problem Solving',
      order: 1,
    },
  ];

  for (const q of questions) {
    await prisma.question.create({
      data: {
        ...q,
        payload: JSON.stringify(q.payload),
      },
    });
  }

  console.log('✅ Questions created');

  // ─── Enrollments ──────────────────────────────────────────────────
  for (const student of [student1, student2, student3]) {
    await prisma.enrollment.upsert({
      where: { examId_studentId: { examId: mcqExam.id, studentId: student.id } },
      update: {},
      create: { examId: mcqExam.id, studentId: student.id },
    });
    await prisma.enrollment.upsert({
      where: { examId_studentId: { examId: codingExam.id, studentId: student.id } },
      update: {},
      create: { examId: codingExam.id, studentId: student.id },
    });
  }

  console.log('✅ Enrollments created');
  console.log('\n🎉 Seed complete! Demo credentials:');
  console.log('   Admin:   admin@examplatform.com / Admin@1234');
  console.log('   Teacher: teacher@examplatform.com / Teacher@1234');
  console.log('   Student: student1@examplatform.com / Student@1234');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
