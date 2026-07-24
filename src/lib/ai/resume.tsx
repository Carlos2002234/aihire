import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { Document, Page, renderToBuffer, StyleSheet, Text, View } from "@react-pdf/renderer";

import {
  buildResumeUserPrompt,
  RESUME_OUTPUT_SCHEMA,
  RESUME_SYSTEM_PROMPT,
  type ResumeInput,
  type ResumeOutput,
} from "./prompts";

const RESUME_MODEL = "claude-opus-4-8";

export async function generateResumeContent(input: ResumeInput): Promise<ResumeOutput> {
  const anthropic = new Anthropic();
  const response = await anthropic.messages.parse({
    model: RESUME_MODEL,
    max_tokens: 4096,
    thinking: { type: "adaptive" },
    output_config: {
      effort: "high",
      format: { type: "json_schema", schema: RESUME_OUTPUT_SCHEMA },
    },
    system: RESUME_SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildResumeUserPrompt(input) }],
  });

  if (!response.parsed_output) {
    throw new Error("La generación del CV no produjo output estructurado");
  }
  return response.parsed_output;
}

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#1a1a1a" },
  name: { fontSize: 20, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  headline: { fontSize: 12, color: "#444444", marginBottom: 12 },
  summary: { fontSize: 10, lineHeight: 1.4, marginBottom: 16 },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
    borderBottom: "1px solid #cccccc",
    paddingBottom: 3,
  },
  entry: { marginBottom: 10 },
  entryHeaderRow: { flexDirection: "row", justifyContent: "space-between" },
  entryTitle: { fontSize: 10.5, fontFamily: "Helvetica-Bold" },
  entryDates: { fontSize: 9, color: "#555555" },
  entrySubtitle: { fontSize: 10, color: "#333333", marginBottom: 3 },
  bullet: { fontSize: 9.5, lineHeight: 1.4, marginBottom: 2, paddingLeft: 8 },
  skillsRow: { fontSize: 9.5, lineHeight: 1.5 },
});

function ResumeDocument({ candidateName, resume }: { candidateName: string; resume: ResumeOutput }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.name}>{candidateName}</Text>
        <Text style={styles.headline}>{resume.headline}</Text>
        <Text style={styles.summary}>{resume.summary}</Text>

        {resume.work_experience.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Experiencia</Text>
            {resume.work_experience.map((exp, i) => (
              <View key={i} style={styles.entry}>
                <View style={styles.entryHeaderRow}>
                  <Text style={styles.entryTitle}>{exp.title}</Text>
                  <Text style={styles.entryDates}>{exp.date_range}</Text>
                </View>
                <Text style={styles.entrySubtitle}>{exp.company}</Text>
                {exp.bullets.map((bullet, j) => (
                  <Text key={j} style={styles.bullet}>
                    • {bullet}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        )}

        {resume.education.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Educación</Text>
            {resume.education.map((edu, i) => (
              <View key={i} style={styles.entry}>
                <View style={styles.entryHeaderRow}>
                  <Text style={styles.entryTitle}>
                    {edu.degree} — {edu.field}
                  </Text>
                  <Text style={styles.entryDates}>{edu.date_range}</Text>
                </View>
                <Text style={styles.entrySubtitle}>{edu.institution}</Text>
              </View>
            ))}
          </View>
        )}

        {resume.skills.length > 0 && (
          <View style={styles.entry}>
            <Text style={styles.sectionTitle}>Skills</Text>
            <Text style={styles.skillsRow}>{resume.skills.join("  ·  ")}</Text>
          </View>
        )}

        {resume.certifications.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Certificaciones</Text>
            {resume.certifications.map((cert, i) => (
              <Text key={i} style={styles.bullet}>
                • {cert.name} — {cert.issuer}
              </Text>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
}

export async function renderResumePdf(candidateName: string, resume: ResumeOutput): Promise<Buffer> {
  return renderToBuffer(<ResumeDocument candidateName={candidateName} resume={resume} />);
}
