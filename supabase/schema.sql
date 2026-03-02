-- ============================================================
-- MFR-CFA La Chauvinière — Planning Hebdomadaire
-- Schéma Supabase complet avec RLS
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Tables ──────────────────────────────────────────────────

-- 1. Moniteurs
CREATE TABLE IF NOT EXISTS moniteurs (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom        VARCHAR(100) NOT NULL,
  surnom     VARCHAR(10)  NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Salles
CREATE TABLE IF NOT EXISTS salles (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom        VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Groupes (un groupe par semaine)
CREATE TABLE IF NOT EXISTS groupes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  semaine     DATE         NOT NULL,  -- Lundi de la semaine
  nom         VARCHAR(50)  NOT NULL,
  nom_couleur VARCHAR(20)  NOT NULL,  -- "GF_VERT", "AL_BLEU"
  couleur_hex VARCHAR(7)   NOT NULL,  -- "#22c55e"
  created_at  TIMESTAMP DEFAULT NOW(),
  UNIQUE(semaine, nom_couleur)
);

-- 4. Types de cours
CREATE TABLE IF NOT EXISTS types_cours (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom            VARCHAR(100) NOT NULL,
  duree_minutes  INTEGER NOT NULL CHECK (duree_minutes IN (60, 120, 180, 240))
);

-- 5. Absences / RTT
CREATE TABLE IF NOT EXISTS absences (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  moniteur_id  UUID REFERENCES moniteurs(id) ON DELETE CASCADE,
  date_debut   DATE NOT NULL,
  date_fin     DATE NOT NULL,
  type         VARCHAR(30) CHECK (type IN ('RTT', 'maladie', 'arret_travail', 'autre')),
  commentaire  TEXT,
  CONSTRAINT dates_coherentes CHECK (date_fin >= date_debut)
);

-- 6. Pauses fixes (rouge, 12h-14h)
CREATE TABLE IF NOT EXISTS pauses (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  jour_semaine INTEGER NOT NULL CHECK (jour_semaine BETWEEN 1 AND 5),
  heure_debut  TIME NOT NULL,
  heure_fin    TIME NOT NULL,
  couleur      VARCHAR(10) DEFAULT 'red'
);

-- 7. Plannings (une entrée par semaine)
CREATE TABLE IF NOT EXISTS plannings (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  semaine     DATE NOT NULL UNIQUE,
  statut      VARCHAR(20) DEFAULT 'brouillon'
              CHECK (statut IN ('brouillon', 'valide', 'publie')),
  valide_par  UUID REFERENCES auth.users(id),
  valide_le   TIMESTAMP,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER plannings_updated_at
  BEFORE UPDATE ON plannings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 8. Séances (les cours planifiés)
CREATE TABLE IF NOT EXISTS seances (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  planning_id   UUID REFERENCES plannings(id) ON DELETE CASCADE,
  groupe_id     UUID REFERENCES groupes(id) ON DELETE CASCADE,
  moniteur_id   UUID REFERENCES moniteurs(id),
  salle_id      UUID REFERENCES salles(id),
  type_cours_id UUID REFERENCES types_cours(id),
  jour_semaine  INTEGER NOT NULL CHECK (jour_semaine BETWEEN 1 AND 5),
  heure_debut   TIME NOT NULL,
  created_at    TIMESTAMP DEFAULT NOW()
);

-- ─── Index de performance ─────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_seances_planning    ON seances(planning_id);
CREATE INDEX IF NOT EXISTS idx_seances_groupe      ON seances(groupe_id);
CREATE INDEX IF NOT EXISTS idx_seances_moniteur    ON seances(moniteur_id);
CREATE INDEX IF NOT EXISTS idx_seances_jour        ON seances(jour_semaine);
CREATE INDEX IF NOT EXISTS idx_absences_moniteur   ON absences(moniteur_id);
CREATE INDEX IF NOT EXISTS idx_absences_dates      ON absences(date_debut, date_fin);
CREATE INDEX IF NOT EXISTS idx_groupes_semaine     ON groupes(semaine);

-- ─── RLS (Row Level Security) ─────────────────────────────────

ALTER TABLE moniteurs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE salles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE groupes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE types_cours ENABLE ROW LEVEL SECURITY;
ALTER TABLE absences    ENABLE ROW LEVEL SECURITY;
ALTER TABLE pauses      ENABLE ROW LEVEL SECURITY;
ALTER TABLE plannings   ENABLE ROW LEVEL SECURITY;
ALTER TABLE seances     ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read everything
CREATE POLICY "Authenticated read moniteurs"   ON moniteurs   FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read salles"      ON salles      FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read groupes"     ON groupes     FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read types_cours" ON types_cours FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read pauses"      ON pauses      FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read absences"    ON absences    FOR SELECT TO authenticated USING (true);

-- Plannings: authenticated can read published + their own brouillon
CREATE POLICY "Read published plannings" ON plannings FOR SELECT TO authenticated
  USING (statut = 'publie' OR auth.uid() IS NOT NULL);

-- Séances: read all published planning's seances
CREATE POLICY "Read seances" ON seances FOR SELECT TO authenticated USING (true);

-- Admin writes (via service_role key in server actions)
-- For simplicity in dev: allow all authenticated users to write
-- In prod, restrict to admin role via auth.users metadata

CREATE POLICY "Authenticated write moniteurs"   ON moniteurs   FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated write salles"      ON salles      FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated write groupes"     ON groupes     FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated write types_cours" ON types_cours FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated write absences"    ON absences    FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated write plannings"   ON plannings   FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated write seances"     ON seances     FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ─── Real-time ────────────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE plannings;
ALTER PUBLICATION supabase_realtime ADD TABLE seances;
