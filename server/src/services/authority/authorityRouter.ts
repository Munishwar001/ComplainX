import { Authority } from '../../models/Authority';
import { AIAnalysisResult } from '../ai/types';

export interface AuthorityMatch {
  authorityId: string;
  name: string;
  department: string;
  email: string;
  city: string;
  state: string;
}

export async function findAuthority(analysis: AIAnalysisResult): Promise<AuthorityMatch | null> {
  const city = analysis.location.city;
  const state = analysis.location.state;
  const category = analysis.category;

  // Try exact city + category
  if (city) {
    const a = await Authority.findOne({
      isActive: true,
      city: new RegExp(`^${city}$`, 'i'),
      categories: category,
    });
    if (a) return toMatch(a);
  }

  // Try state + category
  if (state) {
    const a = await Authority.findOne({
      isActive: true,
      state: new RegExp(`^${state}$`, 'i'),
      categories: category,
    });
    if (a) return toMatch(a);
  }

  // Fallback: any authority that handles this category
  const a = await Authority.findOne({ isActive: true, categories: category });
  return a ? toMatch(a) : null;
}

function toMatch(a: any): AuthorityMatch {
  return {
    authorityId: a._id.toString(),
    name: a.name,
    department: a.department,
    email: a.email,
    city: a.city,
    state: a.state,
  };
}
