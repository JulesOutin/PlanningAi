-- ============================================================
-- MFR Planning — Tables pour la génération automatique
-- À exécuter APRÈS schema.sql
-- ============================================================

-- Association moniteur ↔ cours qu'il peut enseigner
CREATE TABLE IF NOT EXISTS moniteur_types_cours (
  moniteur_id   UUID REFERENCES moniteurs(id) ON DELETE CASCADE,
  type_cours_id UUID REFERENCES types_cours(id) ON DELETE CASCADE,
  PRIMARY KEY (moniteur_id, type_cours_id)
);

-- Modèle : combien d'heures de chaque cours par type de groupe par semaine
CREATE TABLE IF NOT EXISTS modele_planning (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom_couleur        VARCHAR(20) NOT NULL,   -- ex: "GF_VERT"
  type_cours_id      UUID REFERENCES types_cours(id) ON DELETE CASCADE,
  heures_par_semaine NUMERIC(4,1) NOT NULL CHECK (heures_par_semaine > 0),
  UNIQUE(nom_couleur, type_cours_id)
);

-- Disponibilité max par moniteur par semaine (heures)
CREATE TABLE IF NOT EXISTS disponibilite_moniteurs (
  moniteur_id        UUID PRIMARY KEY REFERENCES moniteurs(id) ON DELETE CASCADE,
  heures_max_semaine NUMERIC(4,1) NOT NULL DEFAULT 35
);

-- Calendrier présence groupes : cours vs stage
CREATE TABLE IF NOT EXISTS calendrier_groupes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  semaine     DATE NOT NULL,
  nom_couleur VARCHAR(20) NOT NULL,
  type        VARCHAR(10) NOT NULL CHECK (type IN ('cours', 'stage')),
  UNIQUE(semaine, nom_couleur)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_modele_nom_couleur   ON modele_planning(nom_couleur);
CREATE INDEX IF NOT EXISTS idx_calendrier_semaine   ON calendrier_groupes(semaine);
CREATE INDEX IF NOT EXISTS idx_mtc_moniteur         ON moniteur_types_cours(moniteur_id);
CREATE INDEX IF NOT EXISTS idx_mtc_type_cours       ON moniteur_types_cours(type_cours_id);

-- RLS
ALTER TABLE moniteur_types_cours   ENABLE ROW LEVEL SECURITY;
ALTER TABLE modele_planning        ENABLE ROW LEVEL SECURITY;
ALTER TABLE disponibilite_moniteurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendrier_groupes     ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read/write moniteur_types_cours"    ON moniteur_types_cours    FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth read/write modele_planning"         ON modele_planning         FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth read/write disponibilite_moniteurs" ON disponibilite_moniteurs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth read/write calendrier_groupes"      ON calendrier_groupes      FOR ALL TO authenticated USING (true) WITH CHECK (true);
