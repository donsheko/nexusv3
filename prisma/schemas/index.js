import { z } from "zod";

export const SpecSchema = z.object({
  action: z.enum(["start", "get", "update", "complete", "sync", "parse_spec", "delete"]),
  id: z.number().optional(),
  title: z.string().optional(),
  projectId: z.string().optional(),
  context: z.string().optional(),
  filePath: z.string().optional(),
  stepsCount: z.number().optional(),
  currentStep: z.number().optional(),
  percentage: z.number().optional(),
  status: z.enum(["pending", "in_progress", "completed", "failed"]).optional()
});

export const StepSchema = z.object({
  action: z.enum(["create", "get", "next", "end", "sdr", "heartbeat", "delete"]),
  id: z.number().optional(),
  specId: z.number().optional(),
  stepNumber: z.number().optional(),
  dependsId: z.number().optional().nullable(),
  title: z.string().optional(),
  meta: z.string().optional(),
  context: z.string().optional(),
  status: z.enum(["pending", "in_progress", "completed", "failed"]).optional(),
  data: z.string().optional() // Usado para SDR o Heartbeat (Plano)
});

export const ProjectSchema = z.object({
  action: z.enum(["get", "upsert", "delete"]),
  project: z.string(),
  name: z.string().optional(),
  stack: z.string().optional(),
  devops: z.string().optional()
});

export const AuditSchema = z.object({
  action: z.enum(["create", "get", "fix", "delete"]),
  id: z.number().optional(),
  specId: z.number().optional(),
  title: z.string().optional(),
  issuesFound: z.string().optional(),
  fixPlan: z.string().optional(),
});

export const SdrSchema = z.object({
  action: z.enum(["sdr_upsert", "summary_upsert", "consolidate", "sdr_delete", "summary_delete", "search"]),
  project: z.string(),                              // UUID del proyecto (requerido para todas las acciones)
  id: z.union([z.number(), z.string()]).optional(), // ID numérico (SdrCol) o string (Summary) para upsert/delete
  specId: z.number().optional(),                    // ID de la Spec (sdr_upsert, consolidate)
  content: z.string().optional(),                   // Contenido del Summary (summary_upsert)
  query: z.string().optional(),                     // Término de búsqueda (search)
  tags: z.string().optional(),                      // Etiquetas separadas por coma (summary_upsert)
  sdrIds: z.string().optional(),                    // IDs de SdrCol vinculados (summary_upsert)
  // ── Campos COL (Bitácora de Sabiduría Profunda) ──
  quePaso: z.string().optional(),
  queSenti: z.string().optional(),
  queAprendi: z.string().optional(),
  queQuieroLograr: z.string().optional(),
  quePresupongo: z.string().optional(),
  conceptosClave: z.string().optional(),
  ejemplos: z.string().optional(),
  contraejemplos: z.string().optional(),
  dudasPendientes: z.string().optional(),
});

export const SkillSchema = z.object({
  action: z.enum(["get", "search", "list", "sync", "add"]),
  name: z.string().optional(),
  query: z.string().optional(),
  content: z.string().optional()
});
