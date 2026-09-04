// Reconstruit l'index de recherche après un reseed complet de la base.
import 'dotenv/config'
import { prisma } from '@/lib/prisma'
import { indexProject, indexTask, indexProjectNote } from '@/src/services/rag.service'

async function main() {
  const [projects, tasks, notes] = await Promise.all([
    prisma.project.findMany({ select: { id: true, name: true } }),
    prisma.task.findMany({ select: { id: true, title: true } }),
    prisma.projectNote.findMany({ select: { id: true } }),
  ])

  console.log(`Indexation de ${projects.length} projet(s), ${tasks.length} tâche(s), ${notes.length} message(s)...`)

  for (const project of projects) {
    await indexProject(project.id)
    console.log(`  ✓ projet : ${project.name}`)
  }

  for (const task of tasks) {
    await indexTask(task.id)
    console.log(`  ✓ tâche : ${task.title}`)
  }

  for (const note of notes) {
    await indexProjectNote(note.id)
  }

  const [{ count }] = await prisma.$queryRaw<{ count: bigint }[]>`SELECT count(*) FROM "KnowledgeChunk"`
  console.log(`Terminé — ${count} chunk(s) dans KnowledgeChunk.`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
