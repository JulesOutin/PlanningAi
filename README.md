# MFR Planning — La Chauvinière

Application de planning hebdomadaire pour MFR-CFA La Chauvinière.

## Stack

- **Next.js 15** (App Router) + TypeScript + TailwindCSS + shadcn/ui
- **Supabase** (Postgres + Auth + Real-time + RLS)
- **@react-pdf/renderer** pour l'export PDF
- **Vercel** pour le déploiement

## Démarrage rapide

### 1. Installer les dépendances

```bash
npm install
```

### 2. Configurer Supabase

Créer un projet sur [supabase.com](https://supabase.com), puis :

```bash
cp .env.example .env.local
# Remplir NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### 3. Initialiser la base de données

Dans l'éditeur SQL Supabase :
1. Exécuter `supabase/schema.sql`
2. Exécuter `supabase/seed.sql`

### 4. Créer un utilisateur admin

Dans Supabase Dashboard > Authentication > Users > Invite user

### 5. Lancer en développement

```bash
npm run dev
# → http://localhost:3000
```

### 6. Déployer sur Vercel

```bash
vercel --prod
# Ajouter les variables d'env dans le dashboard Vercel
```

## Structure

```
app/
├── (auth)/login/           # Page de connexion
├── dashboard/
│   ├── planning/[semaine]/ # Vue principale planning
│   ├── moniteurs/          # CRUD moniteurs
│   ├── salles/             # CRUD salles
│   ├── groupes/            # CRUD groupes (par semaine)
│   ├── cours/              # CRUD types de cours
│   └── absences/           # Gestion absences/RTT
└── actions/                # Server Actions Supabase

components/
├── planning/               # PlanningGrid + SeanceCard + ConflictBadge
├── modals/                 # AddSeanceModal + EditSeanceModal
├── pdf/                    # PlanningPDF + PDFDownloadButton
└── ui/                     # Composants shadcn/ui

lib/
├── types.ts                # Types TypeScript + schémas Zod
├── supabase.ts             # Client navigateur
├── supabase-server.ts      # Client serveur (Server Actions)
├── conflicts.ts            # Détection des conflits
└── semaine.ts              # Utilitaires semaine/date
```

## Fonctionnalités

- **Planning grid** : vue semaine avec groupes × jours, drag-and-drop des séances
- **Conflits temps réel** : double booking moniteur/salle, absence, pause rouge
- **Workflow** : brouillon → validé → publié (moniteurs voient uniquement les publiés)
- **Export PDF** : layout pixel-perfect avec couleurs groupes, en-tête MFR
- **CRUD complet** : moniteurs, salles, groupes, cours, absences/RTT

## Données

- Pauses rouges : 12h–14h tous les jours (fixes, non modifiables)
- Groupes : par semaine + couleur (GF_VERT, AL_BLEU, LC_JAUNE…)
- Créneaux : 08h00–18h00 par pas de 30 min (hors pause)
