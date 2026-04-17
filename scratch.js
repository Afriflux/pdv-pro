const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
async function run() {
  const courses = await prisma.course.findMany({
    include: { product: true }
  })
  console.log(JSON.stringify(courses, null, 2))
}
run()
