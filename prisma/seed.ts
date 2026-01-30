import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding ...');

  const passwordHash = await hash('password123', 10);

  // Create Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {
        password: passwordHash,
    },
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'ADMIN',
      password: passwordHash,
    },
  });

  // Create Gifter
  const gifter = await prisma.user.upsert({
    where: { email: 'gifter@example.com' },
    update: {
        password: passwordHash,
    },
    create: {
      email: 'gifter@example.com',
      name: 'Gifter One',
      role: 'GIFTER',
      password: passwordHash,
    },
  });

  // Create Skins
  const skins = [
    {
      name: 'Fanny - Skylark',
      price: 1089,
      isActive: true,
      releaseDate: new Date('2024-01-01'), // Already released
    },
    {
      name: 'Gusion - K\'',
      price: 1288,
      isActive: true,
      releaseDate: new Date('2024-01-01'),
    },
    {
      name: 'Upcoming Legend Skin',
      price: 8999,
      isActive: true,
      releaseDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    },
    {
        name: 'Chou - Iori Yagami',
        price: 1288,
        isActive: true,
        releaseDate: new Date('2024-01-01'),
    }
  ];

  for (const s of skins) {
    const skin = await prisma.skin.create({
      data: s,
    });
    
    // Add some slots for available skins
    if (s.releaseDate < new Date()) {
        await prisma.gifterSlot.create({
            data: {
                skinId: skin.id,
                gifterId: gifter.id,
                isUsed: false
            }
        });
        await prisma.gifterSlot.create({
            data: {
                skinId: skin.id,
                gifterId: gifter.id,
                isUsed: false
            }
        });
    }
    
    console.log(`Created skin with id: ${skin.id}`);
  }

  console.log('Seeding finished.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
