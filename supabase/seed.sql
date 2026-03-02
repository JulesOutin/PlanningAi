-- ============================================================
-- Données de test MFR La Chauvinière
-- ============================================================

-- Pauses réelles (remplace les anciennes)
DELETE FROM pauses;

-- Lundi (1)
INSERT INTO pauses (jour_semaine, heure_debut, heure_fin, couleur) VALUES
  (1, '10:15', '10:45', 'red'),
  (1, '12:30', '13:45', 'red'),
  (1, '15:15', '15:35', 'red'),
  (1, '17:05', '17:15', 'red'),
  (1, '18:15', '18:30', 'red');

-- Mardi (2)
INSERT INTO pauses (jour_semaine, heure_debut, heure_fin, couleur) VALUES
  (2, '08:00', '08:15', 'red'),
  (2, '10:00', '10:30', 'red'),
  (2, '12:15', '13:45', 'red'),
  (2, '15:15', '15:35', 'red'),
  (2, '17:05', '17:15', 'red'),
  (2, '18:15', '18:30', 'red');

-- Mercredi (3)
INSERT INTO pauses (jour_semaine, heure_debut, heure_fin, couleur) VALUES
  (3, '08:00', '08:15', 'red'),
  (3, '10:00', '10:30', 'red'),
  (3, '12:15', '13:45', 'red'),
  (3, '15:15', '15:35', 'red'),
  (3, '17:05', '17:15', 'red'),
  (3, '18:15', '18:30', 'red');

-- Jeudi (4)
INSERT INTO pauses (jour_semaine, heure_debut, heure_fin, couleur) VALUES
  (4, '08:00', '08:15', 'red'),
  (4, '10:00', '10:30', 'red'),
  (4, '12:30', '13:45', 'red'),
  (4, '15:15', '15:35', 'red'),
  (4, '17:05', '17:15', 'red'),
  (4, '18:15', '18:30', 'red');

-- Vendredi (5)
INSERT INTO pauses (jour_semaine, heure_debut, heure_fin, couleur) VALUES
  (5, '08:00', '08:15', 'red'),
  (5, '10:00', '10:30', 'red'),
  (5, '12:30', '13:30', 'red'),
  (5, '14:30', '15:30', 'red');

-- Moniteurs
INSERT INTO moniteurs (nom, surnom) VALUES
  ('Claude Gautier',     'CG'),
  ('Denis Renard',       'DR'),
  ('Fabrice Chauvin',    'FC'),
  ('Emmanuel Sorel',     'ES'),
  ('Alain Lemaire',      'AL'),
  ('Sébastien Leduc',    'SL'),
  ('Florent Chauveau',   'FCh'),
  ('Jean-Paul Martin',   'JP')
ON CONFLICT (surnom) DO NOTHING;

-- Salles
INSERT INTO salles (nom) VALUES
  ('SALLE MULTIMEDIA'),
  ('SALLE VERTE'),
  ('SALLE BLEU'),
  ('STADE'),
  ('REFECTOIRE'),
  ('ATELIER'),
  ('AMPHI')
ON CONFLICT (nom) DO NOTHING;

-- Types de cours
INSERT INTO types_cours (nom, duree_minutes) VALUES
  ('Français MG2',          120),
  ('Mathématiques MG2',     120),
  ('Technologie JP',         60),
  ('Biologie ES',            60),
  ('Chimie DR',              60),
  ('Physique FC',            60),
  ('Éducation physique',    120),
  ('Économie AL',            60),
  ('Atelier pratique',      240),
  ('Voyage pédagogique',    240),
  ('Projet collectif',      120),
  ('Histoire-Géo SL',       120)
ON CONFLICT DO NOTHING;

-- Groupes pour la semaine du 16/02/2026 (semaine 08)
DO $$
DECLARE
  semaine_08 DATE := '2026-02-16';
BEGIN
  INSERT INTO groupes (semaine, nom, nom_couleur, couleur_hex) VALUES
    (semaine_08, 'CAPa1 - Groupe Forêt',       'GF_VERT',   '#22c55e'),
    (semaine_08, 'CAPa1 - Groupe Aménagement', 'AL_BLEU',   '#3b82f6'),
    (semaine_08, 'CAPa2 - Groupe Jardin',      'LC_JAUNE',  '#eab308'),
    (semaine_08, 'BAC PRO - Groupe Sport',     'SL_VIOLET', '#a855f7')
  ON CONFLICT (semaine, nom_couleur) DO NOTHING;
END $$;
