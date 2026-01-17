const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const users = [
  // HR Admin
  {
    id: 'H-101',
    name: 'Anjali Sharma',
    role: 'hr',
    designation: 'HR Manager',
    department: 'Human Resources',
    password: '12345'
  },
  // Corporate Employees (Salaried) - Indian Context
  {
    id: 'E-101',
    name: 'Vikram Malhotra',
    role: 'employee',
    designation: 'Senior Software Engineer',
    department: 'Engineering',
    monthlySalary: 85000, 
    ctc: 1200000, // 12 LPA
    shift: 'General',
    salaryBreakdown: JSON.stringify({ basic: 42500, hra: 21250, pf: 1800, special: 19450 }),
    password: '12345'
  },
  {
    id: 'E-102',
    name: 'Priya Iyer',
    role: 'employee',
    designation: 'Product Analyst',
    department: 'Product',
    monthlySalary: 65000,
    ctc: 900000, // 9 LPA
    shift: 'General',
    salaryBreakdown: JSON.stringify({ basic: 32500, hra: 16250, pf: 1800, special: 14450 }),
    password: '12345'
  },
  {
    id: 'E-103',
    name: 'Rohan Gupta',
    role: 'employee',
    designation: 'Marketing Lead',
    department: 'Marketing',
    monthlySalary: 72000,
    ctc: 1000000, // 10 LPA
    shift: 'General',
    salaryBreakdown: JSON.stringify({ basic: 36000, hra: 18000, pf: 1800, special: 16200 }),
    password: '12345'
  },
  // Industrial Workers (Hourly) - Indian Context (Blue Collar)
  {
    id: 'W-101',
    name: 'Ramesh Yadav',
    role: 'worker',
    designation: 'Machine Operator',
    department: 'Production',
    hourlyRate: 150, // Approx 25-30k/month depending on OT
    shift: 'Morning',
    password: '12345'
  },
  {
    id: 'W-102',
    name: 'Suresh Kumar',
    role: 'worker',
    designation: 'Assembly Technician',
    department: 'Assembly',
    hourlyRate: 140,
    shift: 'Night',
    password: '12345'
  },
  {
    id: 'W-103',
    name: 'Rajesh Singh',
    role: 'worker',
    designation: 'Helper',
    department: 'Logistics',
    hourlyRate: 110,
    shift: 'General',
    password: '12345'
  },
  {
    id: 'W-104',
    name: 'Sunil Patil',
    role: 'worker',
    designation: 'Quality Check Assistant',
    department: 'Quality',
    hourlyRate: 160,
    shift: 'General',
    password: '12345'
  }
];

async function main() {
  console.log('Clearing database...');
  // Delete using prisma but respect foreign keys (cascade in schema not set, so delete child first)
  await prisma.attendance.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.user.deleteMany();

  console.log('Seeding Users...');
  for (const user of users) {
    await prisma.user.create({ data: user });
  }

  console.log('Seeding Past Attendance (Last 7 Days)...');
  const today = new Date();
  for (let i = 1; i <= 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i); // Go back i days
    date.setHours(0,0,0,0); // Normalize to midnight UTC-ish representation

    // Skip Sundays (just simple logic, not calendar accurate for every year but good for mock)
    // getDay 0 is Sunday
    if (date.getDay() === 0) continue;

    for (const user of users) {
      if (user.role === 'hr') continue; // HR doesn't track hourly attendance usually
      
      // Randomize attendance
      const rand = Math.random();
      
      // 80% Present, 10% Absent, 10% Late/HalfDay
      if (rand > 0.2) {
        // PRESENT
        // Variable shift times based on worker shift? Keeping simple 9-5 for now
        const inTime = new Date(date);
        inTime.setHours(9, Math.floor(Math.random() * 30), 0); // 9:00 - 9:30 AM
        
        const outTime = new Date(date);
        outTime.setHours(17, Math.floor(Math.random() * 60), 0); // 5:00 - 6:00 PM
        
        // Calculate hours roughly
        const hours = ((outTime - inTime) / (1000 * 60 * 60));
        let worked = Math.floor(hours);
        let ot = 0;
        
        // Random OT for workers
        if (user.role === 'worker' && Math.random() > 0.7) {
            outTime.setHours(19, 0, 0); // Worked till 7 PM
            worked = 10;
            ot = 2;
        }

        await prisma.attendance.create({
          data: {
            date: date,
            inTime: inTime,
            outTime: outTime,
            status: 'Present',
            workedHours: worked,
            otHours: ot,
            userId: user.id
          }
        });
      } else if (rand > 0.1) {
          // ABSENT
          await prisma.attendance.create({
          data: {
            date: date,
            status: 'Absent',
            workedHours: 0,
            userId: user.id
          }
        });
      } else {
          // LEAVE (Simulated approved leave)
           await prisma.attendance.create({
          data: {
            date: date,
            status: 'Leave',
            workedHours: 0,
            userId: user.id
          }
        });
      }
    }
  }

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
