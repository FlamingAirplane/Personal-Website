import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Profile
  await prisma.siteProfile.upsert({
    where: { id: 'main-profile' },
    update: {
      name: 'Adine Johnson',
      tagline: 'Game Designer & Sound Designer attending SCAD',
      bio: 'Hello, I am Adine Johnson and I am a junior systems designer student majoring in Game Design at Savannah College of Art and Design (SCAD). I am a lover of all types of games and enjoy playing, studying, and making them in my spare time. I also am very fond of reading, writing, and learning about anything.',
      email: 'AAdineWJ3@gmail.com',
      phone: '346-234-5895',
      imageUrl: '/images/profilepic.jpeg',
    },
    create: {
      id: 'main-profile',
      name: 'Adine Johnson',
      tagline: 'Game Designer & Sound Designer attending SCAD',
      bio: 'Hello, I am Adine Johnson and I am a junior systems designer student majoring in Game Design at Savannah College of Art and Design (SCAD). I am a lover of all types of games and enjoy playing, studying, and making them in my spare time. I also am very fond of reading, writing, and learning about anything.',
      email: 'AAdineWJ3@gmail.com',
      phone: '346-234-5895',
      imageUrl: '/images/profilepic.jpeg',
    },
  });

  // Game Portfolio Items
  const gamePortfolioItems = [
    {
      id: 'freezepoint',
      title: 'FreezePoint',
      category: 'Game Design & Sound Design',
      description: 'A collaborative game design and sound design project. FreezePoint combines immersive gameplay mechanics with carefully crafted audio to create a compelling interactive experience.',
      imageUrl: '/images/portfolio/FrezzePoint.png',
      projectLink: '#',
      year: 2025,
      type: 'game',
      tags: 'Game Design,Sound Design,Collaboration',
      sortOrder: 1,
    },
    {
      id: 'wrappers-please',
      title: 'Wrappers Please',
      category: 'Game Design & Sound Design',
      description: 'A unique game combining creative game design with immersive sound design elements. Players engage with intuitive mechanics in a fun and engaging environment.',
      imageUrl: '/images/portfolio/WrapersPlease.png',
      projectLink: '#',
      year: 2025,
      type: 'game',
      tags: 'Game Design,Sound Design',
      sortOrder: 2,
    },
    {
      id: 'parking-day',
      title: 'Parking Day SCAD Pro',
      category: 'Public Speaking & Website Design',
      description: 'A SCAD Pro project involving public speaking and website design for Parking Day. Combined design skills with professional presentation to create an impactful community event.',
      imageUrl: '/images/portfolio/ParkingDay.png',
      projectLink: '#',
      year: 2024,
      type: 'game',
      tags: 'Public Speaking,Website Design,SCAD Pro',
      sortOrder: 3,
    },
    {
      id: 'manacy',
      title: 'Manacy',
      category: 'Solo Game',
      description: 'An independently developed solo game project showcasing game design skills from concept to completion.',
      imageUrl: '/images/portfolio/woodcraft.jpg',
      projectLink: '#',
      year: 2024,
      type: 'game',
      tags: 'Solo Game,Independent',
      sortOrder: 4,
    },
    {
      id: 'autonomous-tracker',
      title: 'Autonomous Tracker',
      category: 'Solo Game',
      description: 'A solo game project featuring autonomous tracking mechanics and engaging gameplay systems.',
      imageUrl: '/images/portfolio/AutonomousTracker.png',
      projectLink: '#',
      year: 2024,
      type: 'game',
      tags: 'Solo Game,Systems Design',
      sortOrder: 5,
    },
    {
      id: 'attack-crab-people',
      title: 'Attack of the Crab People',
      category: 'Project Lead',
      description: 'Led a team project creating an exciting game experience. As project lead, managed design direction, team coordination, and overall game development.',
      imageUrl: '/images/portfolio/AotCP.png',
      projectLink: '#',
      year: 2024,
      type: 'game',
      tags: 'Project Lead,Team Game,Board Game',
      sortOrder: 6,
    },
    {
      id: '33333-ft',
      title: '33,333 ft',
      category: 'Solo Game',
      description: 'A solo game project exploring height and scale in game design.',
      imageUrl: '/images/portfolio/33333ft.png',
      projectLink: '#',
      year: 2024,
      type: 'game',
      tags: 'Solo Game,Coming Soon',
      sortOrder: 7,
    },
  ];

  for (const item of gamePortfolioItems) {
    await prisma.portfolioItem.upsert({
      where: { id: item.id },
      update: item,
      create: item,
    });
  }

  // Sound Portfolio Items
  const soundPortfolioItems = [
    {
      id: 'grime-go-away',
      title: 'Grime Go Away',
      category: 'Sound Design',
      description: 'A sound design project creating immersive audio landscapes and effects. Every auditory element was carefully sculpted to enhance the overall experience.',
      imageUrl: '/images/portfolio/GrimeGoAway.jpg',
      projectLink: '#',
      year: 2025,
      type: 'sound',
      tags: 'Sound Design,SFX',
      sortOrder: 1,
    },
  ];

  for (const item of soundPortfolioItems) {
    await prisma.portfolioItem.upsert({
      where: { id: item.id },
      update: item,
      create: item,
    });
  }

  // Work History
  const workHistoryItems = [
    {
      id: 'womack-dev',
      company: 'Womack Development',
      position: 'Website Manager',
      description: 'While working as a Website Manager, I learned how to deal with unexpected situations and how to prioritize tasks when given multiple jobs to complete.',
      startDate: 'June 2025',
      endDate: 'August 2025',
      sortOrder: 1,
    },
    {
      id: '3-stories',
      company: '3 Stories',
      position: "Bartender's Assistant",
      description: "While working as a Bartender's Assistant, I learned how to work in a fast-paced environment while maintaining a level of quality and professionalism.",
      startDate: 'December 2024',
      endDate: 'August 2025',
      sortOrder: 2,
    },
    {
      id: 'sjli',
      company: 'SJLI',
      position: 'Higher Pathways Scholar',
      description: 'While working as a Higher Pathways Scholar, I was able to share my college experience with rising college freshmen to better prepare them for college.',
      startDate: 'May 2023',
      endDate: 'August 2023',
      sortOrder: 3,
    },
    {
      id: 'freelance-tutor',
      company: 'Freelance',
      position: 'Math Tutor',
      description: 'While working as a Freelance Tutor, I learned how to educate others quickly on complex topics in a professional setting.',
      startDate: 'November 2022',
      endDate: 'March 2023',
      sortOrder: 4,
    },
  ];

  for (const item of workHistoryItems) {
    await prisma.workHistory.upsert({
      where: { id: item.id },
      update: item,
      create: item,
    });
  }

  console.log('Database seeded successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e: any) => {
    console.error('Seed error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
