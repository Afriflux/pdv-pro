const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "public"."Product" ADD COLUMN "seo_title" TEXT;`);
    console.log("Added seo_title column.");
  } catch(e) {
    if (e.message.includes("already exists")) {
       console.log("seo_title already exists.");
    } else {
       console.log("Error adding seo_title:", e.message);
    }
  }

  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "public"."Product" ADD COLUMN "seo_description" TEXT;`);
    console.log("Added seo_description column.");
  } catch(e) {
    if (e.message.includes("already exists")) {
       console.log("seo_description already exists.");
    } else {
       console.log("Error adding seo_description:", e.message);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
