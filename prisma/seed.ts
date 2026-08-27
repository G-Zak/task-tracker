import * as bcrypt from 'bcrypt'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient, ProjectStatus, Role, TaskPriority, TaskStatus } from '@/generated/client'

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL ?? '' }),
})

const MOROCCAN_FIRST_NAMES = [
  'Youssef', 'Amine', 'Karim', 'Omar', 'Yassine', 'Anas', 'Mehdi', 'Reda',
  'Soufiane', 'Ayoub', 'Ilyas', 'Rachid', 'Nabil', 'Othmane', 'Adil',
  'Fatima Zahra', 'Salma', 'Imane', 'Khadija', 'Meriem', 'Sara', 'Nour',
  'Hajar', 'Ghita', 'Zineb', 'Lamiae', 'Asmae', 'Rania', 'Kenza', 'Loubna',
]

const MOROCCAN_LAST_NAMES = [
  'Bennani', 'Alaoui', 'Tazi', 'Idrissi', 'El Amrani', 'Chraibi', 'Berrada',
  'Fassi', 'Cherkaoui', 'Benjelloun', 'Squalli', 'Lahlou', 'Guessous',
  'Bouzidi', 'Sbai', 'Ziani', 'Rahmouni', 'Kabbaj', 'Moussaoui', 'Tahiri',
]

const CLIENT_NAME_POOL = [
  { name: 'Maroc Telecom', domain: 'iam.ma' },
  { name: 'Bank Al-Maghrib', domain: 'bkam.ma' },
  { name: 'Royal Air Maroc', domain: 'royalairmaroc.com' },
  { name: 'Marjane Holding', domain: 'marjane.ma' },
  { name: 'CDG Capital', domain: 'cdgcapital.ma' },
  { name: 'ONCF', domain: 'oncf.ma' },
  { name: 'ADM - Autoroutes du Maroc', domain: 'adm.co.ma' },
  { name: 'Attijariwafa Bank', domain: 'attijariwafa.com' },
  { name: 'Managem Group', domain: 'managemgroup.com' },
  { name: 'Akdital Santé', domain: 'akdital.ma' },
]

const TASK_TITLE_POOL = [
  'Automatiser les tests de charge du cluster edge',
  'Refondre le pipeline CI/CD des modèles embarqués',
  'Auditer la conformité RGPD des flux clients',
  'Mettre en place la supervision temps réel des capteurs',
  'Réduire la latence du moteur d inférence embarqué',
  'Cartographier les dépendances de l infrastructure souveraine',
  'Rédiger la documentation d intégration API partenaires',
  'Stabiliser le déploiement multi-région',
  'Concevoir le tableau de bord de suivi des flottes',
  'Chiffrer les échanges inter-services critiques',
  'Optimiser le stockage des séries temporelles capteurs',
  'Mettre à jour le firmware des unités mobiles',
  'Industrialiser le pipeline d étiquetage des données',
  'Renforcer les tests de résilience réseau',
  'Migrer la base de configuration vers le cloud souverain',
  'Former les équipes terrain au nouveau tableau de bord',
  'Corriger les alertes faux positifs du monitoring',
  'Préparer l audit de sécurité trimestriel',
]

function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function startedAtForStatus(status: TaskStatus): Date | null {
  if (status === TaskStatus.TODO) return null
  const hoursAgo = randomInt(2, 240)
  return new Date(Date.now() - hoursAgo * 60 * 60 * 1000)
}

function approvedAtForStatus(status: TaskStatus, startedAt: Date | null): Date | null {
  if (status !== TaskStatus.DONE || !startedAt) return null
  const hoursAfterStart = randomInt(1, 72)
  return new Date(startedAt.getTime() + hoursAfterStart * 60 * 60 * 1000)
}

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

  const teamLead = await prisma.user.create({
    data: {
      email: 'lead@abatechnology.com',
      firstName: 'Karim',
      lastName: 'Tazi',
      passwordHash: passwordHash,
      role: Role.TEAM_LEADER,
      organisationId: organisation.id,
    },
  })

  const collaborator = await prisma.user.create({
    data: {
      email: 'user@abatechnology.com',
      firstName: 'Yassine',
      lastName: 'El Amrani',
      passwordHash: passwordHash,
      role: Role.USER,
      organisationId: organisation.id,
    },
  })

  const usedEmails = new Set([
    'admin@abatechnology.com',
    'manager@abatechnology.com',
    'hind@abatechnology.com',
    'lead@abatechnology.com',
    'user@abatechnology.com',
  ])
  const fakeUsers = []

  for (let i = 0; i < 14; i++) {
    const firstName = randomItem(MOROCCAN_FIRST_NAMES)
    const lastName = randomItem(MOROCCAN_LAST_NAMES)

    let email = `${firstName}.${lastName}@abatechnology.com`.toLowerCase().replace(/\s+/g, '-')
    let suffix = 1
    while (usedEmails.has(email)) {
      email = `${firstName}.${lastName}${suffix}@abatechnology.com`.toLowerCase().replace(/\s+/g, '-')
      suffix += 1
    }
    usedEmails.add(email)

    const role = Math.random() < 0.15 ? Role.TEAM_LEADER : Role.USER

    const user = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        passwordHash,
        role,
        organisationId: organisation.id,
      },
    })
    fakeUsers.push(user)
  }

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

  for (const { name, domain } of shuffle(CLIENT_NAME_POOL).slice(0, 6)) {
    await prisma.client.create({
      data: {
        name,
        email: `contact@${domain}`,
        phone: `+212 5${randomInt(20, 39)}-${randomInt(100000, 999999)}`,
        organisationId: organisation.id,
      },
    })
  }

  await prisma.team.create({
    data: {
      name: 'ABA Sovereignty & Hardware',
      description: 'Équipe matériel et systèmes embarqués',
      organisationId: organisation.id,
      leaderId: teamLead.id,
      members: {
        connect: [{ id: fakeUsers[0].id }, { id: collaborator.id }],
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
        connect: [{ id: admin.id }, { id: teamMember.id }, { id: collaborator.id }],
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
        connect: [{ id: admin.id }, { id: fakeUsers[1].id }],
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
    const startedAt = startedAtForStatus(task.status)
    await prisma.task.create({
      data: {
        title: task.title,
        status: task.status,
        priority: task.priority,
        startedAt,
        approvedAt: approvedAtForStatus(task.status, startedAt),
        organisationId: organisation.id,
        projectId: task.projectId,
        taskTypeId: task.taskTypeId,
        assignees: {
          connect: [{ id: teamMember.id }],
        },
      },
    })
  }

  const allUsers = [admin, projectManager, teamMember, teamLead, collaborator, ...fakeUsers]
  const allProjects = [projectHealth, projectIndustry, projectCloud]
  const allTaskTypes = [taskTypeHardware, taskTypeAI, taskTypeInfra]
  const allStatuses = Object.values(TaskStatus)
  const allPriorities = Object.values(TaskPriority)

  for (const title of shuffle(TASK_TITLE_POOL)) {
    const status = randomItem(allStatuses)
    const assigneeCount = randomInt(1, 2)
    const assignees = shuffle(allUsers).slice(0, assigneeCount)

    const startedAt = startedAtForStatus(status)
    await prisma.task.create({
      data: {
        title,
        status,
        priority: randomItem(allPriorities),
        startedAt,
        approvedAt: approvedAtForStatus(status, startedAt),
        organisationId: organisation.id,
        projectId: randomItem(allProjects).id,
        taskTypeId: randomItem(allTaskTypes).id,
        assignees: {
          connect: assignees.map((assignee) => ({ id: assignee.id })),
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