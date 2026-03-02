# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commandes

```bash
npm install          # Installer les dépendances
npm run dev          # Démarrer en développement → http://localhost:3000
npm run build        # Build de production
npm run lint         # ESLint
```

## Stack

- **Next.js 15** App Router + TypeScript strict + TailwindCSS + shadcn/ui
- **Supabase** (Postgres + Auth + RLS + Real-time) via `@supabase/ssr`
- **@react-pdf/renderer** pour l'export PDF (chargé côté client uniquement via `dynamic`)
- **react-hook-form** + **zod** pour les formulaires/validation
- **sonner** pour les toasts

## Architecture

### Flux de données
- Les **Server Components** (`app/dashboard/*/page.tsx`) fetchent les données via les Server Actions (`app/actions/*.ts`)
- Les **Client Components** (`*Client.tsx`) gèrent l'état UI interactif
- Les mutations passent par des **Server Actions** (`'use server'`) qui appellent Supabase et font `revalidatePath`

### Client Supabase
- `lib/supabase.ts` → client navigateur (`createBrowserClient`)
- `lib/supabase-server.ts` → client serveur pour Server Components et Server Actions

### Planning Grid
Le composant `components/planning/PlanningGrid.tsx` est une grille HTML custom (table) — **pas** react-big-calendar. Architecture :
- Lignes = Groupes, colonnes = jours Lun–Ven
- Drag-and-drop HTML5 natif entre cellules (groupe × jour)
- Détection de conflits en temps réel via `lib/conflicts.ts` lors de l'édition
- Chaque séance a un `SeanceCard` draggable, chaque cellule est un drop target

### Workflow planning
`brouillon` → `valide` → `publie` (les moniteurs voient uniquement les plannings publiés)

### PDF
`PlanningPDF.tsx` est un composant `@react-pdf/renderer` chargé uniquement côté client (via `next/dynamic` avec `ssr: false`).

## Base de données

Schéma complet dans `supabase/schema.sql`, données de test dans `supabase/seed.sql`.

Tables principales : `moniteurs`, `salles`, `groupes` (par semaine + couleur), `types_cours`, `absences`, `pauses` (12h–14h fixes), `plannings` (une entrée par semaine ISO lundi), `seances`.

## Variables d'environnement requises

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```
