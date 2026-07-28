import * as bcrypt from 'bcrypt'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient, ProjectStatus, Role, TaskPriority, TaskStatus } from '@/generated/client'

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL ?? '' }),
})

async function main() {
  const salt = await bcrypt.genSalt(10)
  const passwordHash = await bcrypt.hash('admin1234', salt)
  console.log('Démarrage du seed de démonstration...')

  await prisma.projectNote.deleteMany()
  await prisma.task.deleteMany()
  await prisma.team.deleteMany()
  await prisma.project.deleteMany()
  await prisma.client.deleteMany()
  await prisma.user.deleteMany()
  await prisma.taskType.deleteMany()
  await prisma.organisation.deleteMany()

  const organisation = await prisma.organisation.create({
    data: {
      name: 'ABA Technology - Nextronic',
    },
  })

  const taskTypeHardware = await prisma.taskType.create({
    data: {
      name: 'Engineering & Hardware',
      color: '#1e3a8a',
      organisationId: organisation.id,
    },
  })

  const taskTypeAI = await prisma.taskType.create({
    data: {
      name: 'IA de bord & modèles',
      color: '#7c3aed',
      organisationId: organisation.id,
    },
  })

  const taskTypeInfra = await prisma.taskType.create({
    data: {
      name: 'Sovereign Infrastructure',
      color: '#10b981',
      organisationId: organisation.id,
    },
  })

  const admin = await prisma.user.create({
    data: {
      email: 'admin@abatechnology.com',
      firstName: 'Zakaria',
      lastName: 'Guennani',
      passwordHash: passwordHash,
      role: Role.ADMIN,
      organisationId: organisation.id,
    },
  })

  const projectManager = await prisma.user.create({
    data: {
      email: 'manager@abatechnology.com',
      firstName: 'Hamza',
      lastName: 'Radi',
      passwordHash: passwordHash,
      role: Role.PROJECT_MANAGER,
      organisationId: organisation.id,
    },
  })

  const teamMember = await prisma.user.create({
    data: {
      email: 'hind@abatechnology.com',
      firstName: 'Hind',
      lastName: 'Rahimi',
      passwordHash: passwordHash,
      role: Role.USER,
      organisationId: organisation.id,
    },
  })

  const engineer = await prisma.user.create({
    data: {
      email: 'engineer@abatechnology.com',
      firstName: 'Alan',
      lastName: 'Cooper',
      passwordHash: passwordHash,
      role: Role.USER,
      organisationId: organisation.id,
    },
  })

  const clientHealth = await prisma.client.create({
    data: {
      name: 'FM6SS (Fondation Mohammed VI)',
      email: 'contact@fm6ss.ma',
      organisationId: organisation.id,
    },
  })

  const clientCloud = await prisma.client.create({
    data: {
      name: 'Numspot',
      email: 'infra@numspot.fr',
      organisationId: organisation.id,
    },
  })

  const clientIndustry = await prisma.client.create({
    data: {
      name: 'OCP Mining Division',
      email: 'operations@ocp.ma',
      organisationId: organisation.id,
    },
  })

  await prisma.team.create({
    data: {
      name: 'ABA Sovereignty & Hardware',
      description: 'Équipe matériel et systèmes embarqués',
      organisationId: organisation.id,
      leaderId: admin.id,
      members: {
        connect: [{ id: engineer.id }],
      },
    },
  })

  await prisma.team.create({
    data: {
      name: 'ABA Fusion AI Agents',
      description: 'Équipe IA et automatisation des flux',
      organisationId: organisation.id,
      leaderId: projectManager.id,
      members: {
        connect: [{ id: teamMember.id }],
      },
    },
  })

  const projectHealth = await prisma.project.create({
    data: {
      name: 'Mobile Medical Units - ABA Life',
      description: 'Déploiement d une santé connectée pour les zones isolées.',
      status: ProjectStatus.IN_PROGRESS,
      organisationId: organisation.id,
      clientId: clientHealth.id,
      members: {
        connect: [{ id: admin.id }, { id: teamMember.id }],
      },
    },
  })

  const projectIndustry = await prisma.project.create({
    data: {
      name: 'Digital Twin & AI Agents - Mining',
      description: 'Intelligence opérationnelle et orchestration de jumeaux numériques.',
      status: ProjectStatus.PLANNING,
      organisationId: organisation.id,
      clientId: clientIndustry.id,
      members: {
        connect: [{ id: projectManager.id }, { id: teamMember.id }],
      },
    },
  })

  const projectCloud = await prisma.project.create({
    data: {
      name: 'Sovereign AI Cloud - Numspot',
      description: 'Infrastructure souveraine et sécurisée pour les systèmes critiques.',
      status: ProjectStatus.ON_HOLD,
      organisationId: organisation.id,
      clientId: clientCloud.id,
      members: {
        connect: [{ id: admin.id }, { id: engineer.id }],
      },
    },
  })

  await prisma.projectNote.create({
    data: {
      content: 'La phase de découverte initiale est terminée et le périmètre a été validé.',
      projectId: projectHealth.id,
      authorId: admin.id,
    },
  })

  const tasks = [
    {
      title: 'Intégrer les capteurs IoT de télémédecine',
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      projectId: projectHealth.id,
      taskTypeId: taskTypeHardware.id,
    },
    {
      title: 'Valider les contrôles de confidentialité des données de santé',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.CRITICAL,
      projectId: projectHealth.id,
      taskTypeId: taskTypeInfra.id,
    },
    {
      title: 'Tester la connectivité edge dans les zones isolées',
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      projectId: projectHealth.id,
      taskTypeId: taskTypeHardware.id,
    },
    {
      title: 'Modéliser le pipeline d ingestion des données IA de bord',
      status: TaskStatus.DONE,
      priority: TaskPriority.MEDIUM,
      projectId: projectIndustry.id,
      taskTypeId: taskTypeAI.id,
    },
    {
      title: 'Déployer les agents d orchestration pour la maintenance prédictive',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.CRITICAL,
      projectId: projectIndustry.id,
      taskTypeId: taskTypeAI.id,
    },
    {
      title: 'Optimiser le LLM multimodal pour les terminaux contraints',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      projectId: projectIndustry.id,
      taskTypeId: taskTypeAI.id,
    },
    {
      title: 'Concevoir l architecture réseau souveraine',
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      projectId: projectCloud.id,
      taskTypeId: taskTypeInfra.id,
    },
    {
      title: 'Isoler les environnements d exécution critiques',
      status: TaskStatus.TODO,
      priority: TaskPriority.CRITICAL,
      projectId: projectCloud.id,
      taskTypeId: taskTypeInfra.id,
    },
    {
      title: 'Documenter le parcours d onboarding pour Fusion AI Academy',
      status: TaskStatus.TODO,
      priority: TaskPriority.LOW,
      projectId: projectCloud.id,
      taskTypeId: taskTypeInfra.id,
    },
  ]

  for (const task of tasks) {
    await prisma.task.create({
      data: {
        title: task.title,
        status: task.status,
        priority: task.priority,
        organisationId: organisation.id,
        projectId: task.projectId,
        taskTypeId: task.taskTypeId,
        assignees: {
          connect: [{ id: teamMember.id }],
        },
      },
    })
  }

  console.log('Seed de démonstration terminé avec succès.')
}

main()
  .catch((error) => {
    console.error('Échec du seed :', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })