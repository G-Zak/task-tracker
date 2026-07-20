import {Role} from "@/src/generated/client"



export interface NavigationItem {
    name: string
    href: string
    icon: string
    allowedRoles: Role[]
}


export const navigationConfig: NavigationItem[] = [
    {
        name: 'Tableau de bord',
        href: '/dashboard',
        icon: 'LayoutDashboard',
        allowedRoles: [Role.ADMIN, Role.PROJECT_MANAGER, Role.TEAM_LEADER, Role.USER, Role.VIEWER] 
    },
    {
        name: 'Projets',
        href: '/projects',
        icon: 'FolderKanban',
        allowedRoles: [Role.ADMIN, Role.PROJECT_MANAGER, Role.TEAM_LEADER, Role.USER, Role.VIEWER]
    },
    {
        name: 'Tâches',
        href: '/tasks',
        icon: 'CheckSquare',
        allowedRoles: [Role.ADMIN, Role.PROJECT_MANAGER, Role.TEAM_LEADER, Role.USER]
    
    },
    {
        name: 'Equipes',
        href: '/teams',
        icon: 'Users',
        allowedRoles: [Role.ADMIN, Role.PROJECT_MANAGER, Role.TEAM_LEADER]
    },
    {
        name: 'Clients',
        href: '/clients',
        icon: 'Building2',
        allowedRoles: [Role.ADMIN, Role.PROJECT_MANAGER, Role.TEAM_LEADER]
    },
    {
        name: 'Utilisateurs',
        href: '/users',
        icon: 'UserCog',
        allowedRoles: [Role.ADMIN]
    },
    {
        name: 'Profil',
        href: '/profile',
        icon: 'User',
        allowedRoles: [Role.ADMIN, Role.PROJECT_MANAGER, Role.TEAM_LEADER, Role.USER, Role.VIEWER]
    }
]