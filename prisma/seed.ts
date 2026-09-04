import * as bcrypt from 'bcrypt'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient, ProjectStatus, Role, TaskPriority, TaskStatus } from '@/generated/client'

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL ?? '' }),
})

const MOROCCAN_FIRST_NAMES = [
  'Hamza', 'Tarik', 'Bilal', 'Mounir', 'Hicham', 'Younes', 'Marouane', 'Aziz',
  'Faycal', 'Driss', 'Walid', 'Samir', 'Hatim', 'Abderrahim',
  'Wafaa', 'Btissam', 'Nadia', 'Latifa', 'Siham', 'Malak', 'Chaimae',
  'Yasmine', 'Amal', 'Douae', 'Manal', 'Hanane', 'Karima', 'Ouiam',
]

const MOROCCAN_LAST_NAMES = [
  'Alami', 'Belhaj', 'Toumi', 'Mansouri', 'Skalli', 'Naciri', 'Sekkat',
  'Filali', 'Ouazzani', 'Benkirane', 'Zerouali', 'Haddaoui', 'Belkadi',
  'Sahli', 'Ghazi', 'Bensouda', 'Lamrani',
]

const CLIENT_NAME_POOL = [
  { name: 'Nova Fintech Labs', domain: 'novafintech.io' },
  { name: 'GreenGrid Energy', domain: 'greengrid-energy.com' },
  { name: 'MedAlliance Group', domain: 'medalliance-group.com' },
  { name: 'Portalis Logistics', domain: 'portalis-logistics.com' },
  { name: 'Assurcap Mutuelle', domain: 'assurcap.ma' },
  { name: 'TerraSense Agritech', domain: 'terrasense.io' },
  { name: 'Office Régional des Infrastructures', domain: 'ori-infra.ma' },
  { name: 'Cedrus Industrial Partners', domain: 'cedrus-partners.com' },
  { name: 'Aurika Biotech', domain: 'aurika-biotech.com' },
  { name: 'Meridian Capital Trust', domain: 'meridian-capital.ma' },
]

const TASK_TITLE_POOL = [
  'Déployer les capteurs de télésurveillance à domicile',
  'Valider la conformité réglementaire des données patients',
  'Intégrer l IA de triage pour les urgences distantes',
  'Calibrer les capteurs biométriques portables',
  'Auditer la sécurité des dossiers médicaux électroniques',
  'Modéliser le jumeau numérique de la ligne d assemblage',
  'Déployer les agents de maintenance prédictive',
  'Optimiser les itinéraires logistiques multi-sites',
  'Automatiser le contrôle qualité par vision embarquée',
  'Cartographier les capteurs IoT du site industriel',
  'Déployer le réseau LoRaWAN pour l éclairage intelligent',
  'Intégrer les capteurs de qualité de l air urbains',
  'Concevoir le tableau de bord énergétique municipal',
  'Sécuriser les communications des infrastructures critiques',
  'Tester la résilience du réseau en cas de coupure',
  'Entraîner le modèle de détection de fraude',
  'Auditer la conformité des flux de paiement',
  'Chiffrer les échanges inter-agences',
  'Déployer l assistant IA de conformité réglementaire',
  'Migrer l infrastructure vers le cloud souverain',
  'Documenter l API d intégration partenaires',
  'Former les équipes terrain aux nouveaux outils',
  'Refondre le pipeline CI/CD des modèles embarqués',
  'Préparer l audit de sécurité trimestriel',
]

const RANDOM_SEED = Number(process.env.SEED_RANDOM_SEED ?? 20260101)

function createRandom(seed: number): () => number {
  let state = seed >>> 0
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const random = createRandom(RANDOM_SEED)

function randomItem<T>(items: T[]): T {
  return items[Math.floor(random() * items.length)]
}

function randomInt(min: number, max: number): number {
  return Math.floor(random() * (max - min + 1)) + min
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
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

const DAY_MS = 24 * 60 * 60 * 1000

function dueDateForStatus(status: TaskStatus, approvedAt: Date | null): Date {
  if (status === TaskStatus.DONE && approvedAt) {
    const onTime = random() > 0.35
    const offsetDays = randomInt(1, 6)
    return onTime
      ? new Date(approvedAt.getTime() + offsetDays * DAY_MS)
      : new Date(approvedAt.getTime() - offsetDays * DAY_MS)
  }

  const bucket = random()
  if (bucket < 0.15) return new Date(Date.now() - randomInt(1, 10) * DAY_MS)
  if (bucket < 0.4) return new Date(Date.now() + randomInt(0, 4) * DAY_MS)
  return new Date(Date.now() + randomInt(5, 30) * DAY_MS)
}

async function main() {
  const salt = await bcrypt.genSalt(10)
  const passwordHash = await bcrypt.hash('admin1234', salt)
  console.log('Démarrage du seed de démonstration...')

  await prisma.knowledgeChunk.deleteMany()
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
      name: 'ABA Technology',
    },
  })

  const taskTypeIoT = await prisma.taskType.create({
    data: {
      name: 'Équipements connectés & IoT',
      color: '#1e3a8a',
      organisationId: organisation.id,
    },
  })

  const taskTypeAI = await prisma.taskType.create({
    data: {
      name: 'IA multimodale & AIoT',
      color: '#7c3aed',
      organisationId: organisation.id,
    },
  })

  const taskTypeSovereign = await prisma.taskType.create({
    data: {
      name: 'Écosystème souverain',
      color: '#10b981',
      organisationId: organisation.id,
    },
  })

  const taskTypeOrchestration = await prisma.taskType.create({
    data: {
      name: 'Orchestration & intégration',
      color: '#ea580c',
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
      lastName: 'Alami',
      passwordHash: passwordHash,
      role: Role.PROJECT_MANAGER,
      organisationId: organisation.id,
    },
  })

  const teamMember = await prisma.user.create({
    data: {
      email: 'nadia@abatechnology.com',
      firstName: 'Nadia',
      lastName: 'Mansouri',
      passwordHash: passwordHash,
      role: Role.USER,
      organisationId: organisation.id,
    },
  })

  const teamLead = await prisma.user.create({
    data: {
      email: 'lead@abatechnology.com',
      firstName: 'Wafaa',
      lastName: 'Belhaj',
      passwordHash: passwordHash,
      role: Role.TEAM_LEADER,
      organisationId: organisation.id,
    },
  })

  const collaborator = await prisma.user.create({
    data: {
      email: 'user@abatechnology.com',
      firstName: 'Tarik',
      lastName: 'Skalli',
      passwordHash: passwordHash,
      role: Role.USER,
      organisationId: organisation.id,
    },
  })

  const usedEmails = new Set([
    'admin@abatechnology.com',
    'manager@abatechnology.com',
    'nadia@abatechnology.com',
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

    const role = random() < 0.15 ? Role.TEAM_LEADER : Role.USER

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

  const viewer = await prisma.user.create({
    data: {
      email: 'viewer@abatechnology.com',
      firstName: 'Karima',
      lastName: 'Ghazi',
      passwordHash,
      role: Role.VIEWER,
      organisationId: organisation.id,
    },
  })

  const clientHealth = await prisma.client.create({
    data: {
      name: 'CareLoop Health Network',
      email: 'contact@careloop-health.org',
      organisationId: organisation.id,
    },
  })

  const clientIndustry = await prisma.client.create({
    data: {
      name: 'Atlas Minerals Group',
      email: 'operations@atlas-minerals.com',
      organisationId: organisation.id,
    },
  })

  const clientTerritory = await prisma.client.create({
    data: {
      name: 'Métropole de Ravelin',
      email: 'infrastructures@ravelin-metropole.ma',
      organisationId: organisation.id,
    },
  })

  const clientBank = await prisma.client.create({
    data: {
      name: 'Banque Solivia',
      email: 'conformite@banque-solivia.ma',
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
      name: 'Équipe Équipements Connectés & Souveraineté',
      description: 'Matériel embarqué, IoT et infrastructures souveraines',
      organisationId: organisation.id,
      leaderId: teamLead.id,
      members: {
        connect: [{ id: fakeUsers[0].id }, { id: collaborator.id }],
      },
    },
  })

  await prisma.team.create({
    data: {
      name: 'Équipe IA Multimodale & AIoT',
      description: 'Modèles d\'IA embarqués et orchestration des flux intelligents',
      organisationId: organisation.id,
      leaderId: projectManager.id,
      members: {
        connect: [{ id: teamMember.id }],
      },
    },
  })

  const projectHealth = await prisma.project.create({
    data: {
      name: 'Réseau IoT de Télésurveillance Médicale',
      description: 'Déploiement d\'un réseau de capteurs connectés pour le suivi à distance des patients en zones isolées.',
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
      name: 'Jumeau Numérique de la Chaîne d\'Approvisionnement',
      description: 'Orchestration de jumeaux numériques et d\'agents IA pour la maintenance prédictive du site industriel.',
      status: ProjectStatus.PLANNING,
      organisationId: organisation.id,
      clientId: clientIndustry.id,
      members: {
        connect: [{ id: projectManager.id }, { id: teamMember.id }],
      },
    },
  })

  const projectTerritory = await prisma.project.create({
    data: {
      name: 'Infrastructures Urbaines Intelligentes',
      description: 'Réseau IoT bas-débit pour l\'éclairage, la qualité de l\'air et la supervision énergétique de la métropole.',
      status: ProjectStatus.IN_PROGRESS,
      organisationId: organisation.id,
      clientId: clientTerritory.id,
      members: {
        connect: [{ id: teamLead.id }, { id: fakeUsers[1].id }],
      },
    },
  })

  const projectBank = await prisma.project.create({
    data: {
      name: 'Plateforme IA Souveraine de Conformité',
      description: 'Détection de fraude et conformité réglementaire sur une infrastructure cloud souveraine et sécurisée.',
      status: ProjectStatus.ON_HOLD,
      organisationId: organisation.id,
      clientId: clientBank.id,
      members: {
        connect: [{ id: admin.id }, { id: fakeUsers[2].id }],
      },
    },
  })

  await prisma.projectNote.create({
    data: {
      content: 'La phase de découverte initiale est terminée et le périmètre a été validé avec le client.',
      projectId: projectHealth.id,
      authorId: admin.id,
    },
  })

  const tasks = [
    {
      title: 'Déployer les capteurs de télésurveillance à domicile',
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      projectId: projectHealth.id,
      taskTypeId: taskTypeIoT.id,
    },
    {
      title: 'Valider la conformité réglementaire des données patients',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.CRITICAL,
      projectId: projectHealth.id,
      taskTypeId: taskTypeSovereign.id,
    },
    {
      title: 'Intégrer l IA de triage pour les urgences distantes',
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      projectId: projectHealth.id,
      taskTypeId: taskTypeAI.id,
    },
    {
      title: 'Modéliser le jumeau numérique de la ligne d assemblage',
      status: TaskStatus.DONE,
      priority: TaskPriority.MEDIUM,
      projectId: projectIndustry.id,
      taskTypeId: taskTypeAI.id,
    },
    {
      title: 'Déployer les agents de maintenance prédictive',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.CRITICAL,
      projectId: projectIndustry.id,
      taskTypeId: taskTypeAI.id,
    },
    {
      title: 'Optimiser les itinéraires logistiques multi-sites',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      projectId: projectIndustry.id,
      taskTypeId: taskTypeOrchestration.id,
    },
    {
      title: 'Déployer le réseau LoRaWAN pour l éclairage intelligent',
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      projectId: projectTerritory.id,
      taskTypeId: taskTypeIoT.id,
    },
    {
      title: 'Intégrer les capteurs de qualité de l air urbains',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.MEDIUM,
      projectId: projectTerritory.id,
      taskTypeId: taskTypeIoT.id,
    },
    {
      title: 'Sécuriser les communications des infrastructures critiques',
      status: TaskStatus.TODO,
      priority: TaskPriority.CRITICAL,
      projectId: projectTerritory.id,
      taskTypeId: taskTypeSovereign.id,
    },
    {
      title: 'Entraîner le modèle de détection de fraude',
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      projectId: projectBank.id,
      taskTypeId: taskTypeAI.id,
    },
    {
      title: 'Auditer la conformité des flux de paiement',
      status: TaskStatus.TODO,
      priority: TaskPriority.CRITICAL,
      projectId: projectBank.id,
      taskTypeId: taskTypeSovereign.id,
    },
    {
      title: 'Migrer l infrastructure vers le cloud souverain',
      status: TaskStatus.TODO,
      priority: TaskPriority.LOW,
      projectId: projectBank.id,
      taskTypeId: taskTypeSovereign.id,
    },
  ]

  for (const task of tasks) {
    const startedAt = startedAtForStatus(task.status)
    const approvedAt = approvedAtForStatus(task.status, startedAt)
    await prisma.task.create({
      data: {
        title: task.title,
        status: task.status,
        priority: task.priority,
        startedAt,
        approvedAt,
        dueDate: dueDateForStatus(task.status, approvedAt),
        organisationId: organisation.id,
        projectId: task.projectId,
        taskTypeId: task.taskTypeId,
        assignees: {
          connect: [{ id: teamMember.id }],
        },
      },
    })
  }

  const allUsers = [admin, projectManager, teamMember, teamLead, collaborator, viewer, ...fakeUsers]
  const allProjects = [projectHealth, projectIndustry, projectTerritory, projectBank]
  const allTaskTypes = [taskTypeIoT, taskTypeAI, taskTypeSovereign, taskTypeOrchestration]
  const allStatuses = Object.values(TaskStatus)
  const allPriorities = Object.values(TaskPriority)

  for (const title of shuffle(TASK_TITLE_POOL)) {
    const status = randomItem(allStatuses)
    const assigneeCount = randomInt(1, 2)
    const assignees = shuffle(allUsers).slice(0, assigneeCount)

    const startedAt = startedAtForStatus(status)
    const approvedAt = approvedAtForStatus(status, startedAt)
    await prisma.task.create({
      data: {
        title,
        status,
        priority: randomItem(allPriorities),
        startedAt,
        approvedAt,
        dueDate: dueDateForStatus(status, approvedAt),
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
