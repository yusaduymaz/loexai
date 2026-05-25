import { z } from "zod";

export const salesStrategySchema = z.object({
  shortPitch: z.string().min(10),
  coldEmail: z.string().min(40),
  instagramDm: z.string().min(10),
  whatsappMessage: z.string().min(10),
  discoveryCallOpener: z.string().min(10),
  objectionHandling: z.array(
    z.object({
      objection: z.string().min(3),
      response: z.string().min(10),
    }),
  ),
  proposalSummary: z.string().min(20),
  valueProposition: z.string().min(20),
});

export const buildPromptSchema = z.object({
  promptBody: z.string().min(80),
  targetTool: z.enum(["claude", "cursor"]),
  techStack: z.array(z.string().min(1)),
});

export const qaResultSchema = z.object({
  status: z.enum(["passed", "warning", "failed"]),
  confidence: z.number().min(0).max(1),
  checks: z.array(
    z.object({
      name: z.string().min(2),
      passed: z.boolean(),
      evidence: z.string().min(1),
    }),
  ),
  issues: z.array(
    z.object({
      severity: z.enum(["low", "medium", "high"]),
      message: z.string().min(5),
    }),
  ),
});

export type SalesStrategyOutput = z.infer<typeof salesStrategySchema>;
export type BuildPromptOutput = z.infer<typeof buildPromptSchema>;
export type QAResultOutput = z.infer<typeof qaResultSchema>;
