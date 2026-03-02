import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer'
import type { Groupe, Planning, Seance } from '@/lib/types'
import { joursDeLaSemaine, JOURS_NOMS, formatJourCourt, numeroSemaine, formatSemaineLabel } from '@/lib/semaine'
import { format } from 'date-fns'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 8,
    padding: 20,
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#1e40af',
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#1e40af',
  },
  headerSub: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 2,
  },
  semaineInfo: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    marginTop: 4,
    color: '#0f172a',
  },
  table: {
    width: '100%',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#1e40af',
  },
  tableHeaderCellFirst: {
    width: '14%',
    padding: 4,
    color: '#ffffff',
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
  },
  tableHeaderCell: {
    flex: 1,
    padding: 4,
    color: '#ffffff',
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    textAlign: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#3b82f6',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    minHeight: 40,
  },
  tableRowAlt: {
    backgroundColor: '#f8fafc',
  },
  groupeCell: {
    width: '14%',
    padding: 4,
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
    justifyContent: 'flex-start',
  },
  groupeName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7,
  },
  groupeNom: {
    fontSize: 6,
    color: '#64748b',
  },
  dayCell: {
    flex: 1,
    padding: 3,
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
  },
  pauseBlock: {
    backgroundColor: '#fee2e2',
    borderRadius: 2,
    padding: 2,
    marginBottom: 2,
    textAlign: 'center',
  },
  pauseText: {
    color: '#dc2626',
    fontSize: 6,
    fontFamily: 'Helvetica-Bold',
  },
  seanceBlock: {
    borderRadius: 2,
    padding: 2,
    marginBottom: 2,
  },
  seanceName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7,
  },
  seanceMeta: {
    fontSize: 6,
    color: '#475569',
  },
  footer: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 7,
    color: '#94a3b8',
  },
})

interface Props {
  planning: Planning
  seances: Seance[]
  groupes: Groupe[]
}

export default function PlanningPDF({ planning, seances, groupes }: Props) {
  const jours = joursDeLaSemaine(planning.semaine)
  const semNum = numeroSemaine(planning.semaine)
  const semLabel = formatSemaineLabel(planning.semaine)
  const generatedDate = format(new Date(), 'dd/MM/yyyy HH:mm')

  function getSeances(groupeId: string, jourSemaine: number): Seance[] {
    return seances
      .filter((s) => s.groupe_id === groupeId && s.jour_semaine === jourSemaine)
      .sort((a, b) => a.heure_debut.localeCompare(b.heure_debut))
  }

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>MFR-CFA La Chauvinière</Text>
          <Text style={styles.headerSub}>
            Tél: 02 43 03 87 77 — mfr.lachauvieremfr.asso.fr
          </Text>
          <Text style={styles.semaineInfo}>
            PLANNING HEBDOMADAIRE 2025–2026 — Semaine {semNum} — {semLabel}
          </Text>
        </View>

        {/* Table */}
        <View style={styles.table}>
          {/* Header row */}
          <View style={styles.tableHeaderRow}>
            <Text style={styles.tableHeaderCellFirst}>Groupe</Text>
            {jours.map((j, i) => (
              <Text key={i} style={styles.tableHeaderCell}>
                {JOURS_NOMS[i]}{'\n'}{formatJourCourt(j)}
              </Text>
            ))}
          </View>

          {/* Group rows */}
          {groupes.map((groupe, gi) => (
            <View key={groupe.id} style={[styles.tableRow, gi % 2 === 1 ? styles.tableRowAlt : {}]}>
              {/* Groupe cell */}
              <View style={styles.groupeCell}>
                <Text style={styles.groupeName}>{groupe.nom_couleur}</Text>
                <Text style={styles.groupeNom}>{groupe.nom}</Text>
              </View>

              {/* Day cells */}
              {[1, 2, 3, 4, 5].map((jourNum) => {
                const cellSeances = getSeances(groupe.id, jourNum)
                return (
                  <View key={jourNum} style={styles.dayCell}>
                    {/* Pause */}
                    <View style={styles.pauseBlock}>
                      <Text style={styles.pauseText}>PAUSE 12h–14h</Text>
                    </View>

                    {/* Séances */}
                    {cellSeances.map((s) => (
                      <View
                        key={s.id}
                        style={[
                          styles.seanceBlock,
                          { backgroundColor: groupe.couleur_hex + '33' },
                        ]}
                      >
                        <Text style={styles.seanceName}>{s.type_cours?.nom ?? '—'}</Text>
                        <Text style={styles.seanceMeta}>
                          {s.heure_debut} • {s.moniteur?.surnom} • {s.salle?.nom}
                        </Text>
                      </View>
                    ))}
                  </View>
                )
              })}
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>MFR-CFA La Chauvinière</Text>
          <Text style={styles.footerText}>Généré le {generatedDate}</Text>
        </View>
      </Page>
    </Document>
  )
}
