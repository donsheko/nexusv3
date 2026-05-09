import { z } from "zod";

export const SpecSchema = z.object({
  action: z.enum(["start", "get", "update", "complete", "sync", "parse_spec"]),
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
  action: z.enum(["create", "get", "next", "end", "sdr", "heartbeat"]),
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
  action: z.enum(["get", "upsert"]),
  project: z.string(),
  name: z.string().optional(),
  stack: z.string().optional(),
  devops: z.string().optional()
});

export const AuditSchema = z.object({
  action: z.enum(["create", "get", "fix"]),
  id: z.number().optional(),
  specId: z.number().optional(),
  title: z.string().optional(),
  issuesFound: z.string().optional(),
  fixPlan: z.string().optional(),
});
