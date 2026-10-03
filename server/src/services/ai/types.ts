import { z } from 'zod';

export const AIAnalysisSchema = z.object({
  category: z.enum([
    'waste_management',
    'road_damage',
    'street_lighting',
    'water_supply',
    'electricity',
    'traffic',
    'sewerage',
    'public_infrastructure',
    'other',
  ]),
  subcategory: z.string().optional(),
  summary: z.string(),
  location: z.object({
    area: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
  }),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  urgency: z.enum(['low', 'normal', 'high', 'emergency']),
  recommendedDepartment: z.string().optional(),
  authorityType: z.string().optional(),
  confidence: z.number().min(0).max(1),
  needsHumanReview: z.boolean(),
});

export type AIAnalysisResult = z.infer<typeof AIAnalysisSchema>;

export const CATEGORY_LABELS: Record<string, string> = {
  waste_management: 'Waste Management',
  road_damage: 'Road Damage',
  street_lighting: 'Street Lighting',
  water_supply: 'Water Supply',
  electricity: 'Electricity',
  traffic: 'Traffic',
  sewerage: 'Sewerage',
  public_infrastructure: 'Public Infrastructure',
  other: 'Other',
};
