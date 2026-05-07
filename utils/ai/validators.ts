import { z } from 'zod';

export const diagnosisSchema = z.object({
  fault_name: z.string().min(1),
  fault_description: z.string().min(1),
  confidence: z.number().min(0).max(100),
  required_parts: z.array(z.string()).default([]),
  required_skill: z.string().min(1),
  est_cost_min: z.number().int().nonnegative(),
  est_cost_max: z.number().int().nonnegative(),
  urgency: z.enum(['low', 'medium', 'high'])
});

export const interviewSchema = z.object({
  score: z.number().min(1).max(10),
  feedback: z.string().min(1),
  strengths: z.array(z.string()).default([]),
  improvements: z.array(z.string()).default([])
});

export const toolkitSchema = z.object({
  verified_tools: z.array(z.string()).default([]),
  missing_tools: z.array(z.string()).default([]),
  overall_verdict: z.boolean()
});

export type DiagnosisResponse = z.infer<typeof diagnosisSchema>;
export type InterviewResponse = z.infer<typeof interviewSchema>;
export type ToolkitResponse = z.infer<typeof toolkitSchema>;
