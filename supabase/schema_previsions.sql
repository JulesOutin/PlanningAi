-- ============================================================
-- MFR Planning — Prévisions d'heures par formation
-- À exécuter dans Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS previsions_heures (
  id                 UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom_groupe         VARCHAR(50) NOT NULL UNIQUE,
  formation_complete VARCHAR(100) NOT NULL,
  type_formation     VARCHAR(10) NOT NULL DEFAULT 'FI', -- FI | APP | FC
  h_prevision        INTEGER     NOT NULL DEFAULT 0,    -- total en minutes
  h_eleves_realisees INTEGER     NOT NULL DEFAULT 0,    -- total en minutes
  h_realisees        INTEGER     NOT NULL DEFAULT 0,    -- total en minutes
  ordre              SMALLINT    NOT NULL DEFAULT 0,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE previsions_heures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read/write previsions_heures"
  ON previsions_heures FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Index
CREATE INDEX IF NOT EXISTS idx_previsions_type ON previsions_heures(type_formation);

-- ─── Seed : Formation Initiale ────────────────────────────────────────────────
-- Heures stockées en minutes (ex: 585h00 = 35100 min)
INSERT INTO previsions_heures
  (nom_groupe, formation_complete, type_formation, h_prevision, h_eleves_realisees, h_realisees, ordre)
VALUES
  ('4e DP',        '4e EA 2025-2026',        'FI', 35100, 20700, 21728,  1),
  ('3e DP',        '3e EA 2025-2026',        'FI', 36540, 17575, 18780,  2),
  ('CAPa1.JP',     'CAPA 2025-2027',         'FI', 33630, 18615, 19593,  3),
  ('CAPa2.JP',     'CAPA 2024-2026',         'FI', 30480, 17774, 18940,  4),
  ('CAPa1.SV',     'CAPA 2025-2027',         'FI', 31736, 18615, 19463,  5),
  ('CAPa2.SV',     'CAPA 2024-2026',         'FI', 30504, 18014, 19139,  6),
  ('CAP1.F',       'CAP 2025-2027',          'FI',     0, 16395, 14640,  7),
  ('CAP2.F',       'CAP 2024-2026',          'FI',     0, 17070, 15505,  8),
  ('CAP F 1 AN',   'CAP 2025-2026',          'FI',     0,  8910,  5370,  9),
  ('BP1.F',        'BP 2025-2027',           'FI',     0, 19170, 10353, 10),
  ('BP2.F',        'BP 2024-2026',           'FI',     0, 19170, 10233, 11),
  ('BP1.AP',       'BPA4 2025-2027',         'FI', 10950, 13395,  9009, 12),
  ('BP2.AP',       'BPA4 2024-2026',         'FI', 10950, 12975,  8536, 13),
  ('2nde NJPF',    'BAC PRO NJPF 2025-2026', 'FI', 27480, 19955, 13604, 14),
  ('2nde CPH',     'BAC PRO CPH 2025-2026',  'FI', 26400, 19955, 13413, 15),
  ('Bac Pro1.AP',  'BAC PRO AP 2024-2027',   'FI', 26599, 22930,  9926, 16),
  ('Bac Pro1.CPH', 'BAC PRO CPH 2024-2027',  'FI', 28950, 22930,  9914, 17),
  ('Bac Pro2.AP',  'BAC PRO AP 2023-2026',   'FI', 29940, 24835, 13114, 18),
  ('Bac Pro2.CPH', 'BAC PRO CPH 2023-2026',  'FI', 29280, 24895, 12741, 19)
ON CONFLICT (nom_groupe) DO NOTHING;
