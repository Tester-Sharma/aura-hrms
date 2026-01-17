const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Cloud Database...');

    // 1. Create HR
    const hr = await prisma.user.upsert({
        where: { id: 'H-101' },
        update: {},
        create: {
            id: 'H-101',
            name: 'Aditya Dway',
            email: 'aditya@aura.inc',
            role: 'hr',
            password: '12345',
            designation: 'HR Manager',
            department: 'Human Resources',
            joiningDate: new Date('2024-01-01')
        }
    });
    console.log(`✅ Created HR: ${hr.name} (${hr.id})`);

    // 2. Create Employee
    const employee = await prisma.user.upsert({
        where: { id: 'E-101' },
        update: {},
        create: {
            id: 'E-101',
            name: 'Vikram Malhotra',
            email: 'vikram@aura.inc',
            role: 'employee',
            password: '12345',
            designation: 'Senior Engineer',
            department: 'Engineering',
            monthlySalary: 85000,
            ctc: 1200000,
            joiningDate: new Date('2024-03-15')
        }
    });
    console.log(`✅ Created Employee: ${employee.name} (${employee.id})`);

    // 3. Create Worker
    const worker = await prisma.user.upsert({
        where: { id: 'W-101' },
        update: {},
        create: {
            id: 'W-101',
            name: 'Ramesh Yadav',
            email: 'ramesh@aura.inc',
            role: 'worker',
            password: '12345', // Plain text as per your system
            designation: 'Assembly Line Worker',
            department: 'Production',
            hourlyRate: 250,
            shift: '09:00 AM - 05:00 PM',
            joiningDate: new Date('2024-02-10')
        }
    });
    console.log(`✅ Created Worker: ${worker.name} (${worker.id})`);

    console.log('🎉 Seeding complete!');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
