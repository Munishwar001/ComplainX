import React from 'react';
import { Brain, MapPin, AlertTriangle, Zap } from 'lucide-react';
import { AIAnalysis } from '../types';

const CATEGORY_LABELS: Record<string, string> = {
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

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 85 ? 'bg-green-500' : pct >= 70 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-semibold ${pct >= 85 ? 'text-green-700' : pct >= 70 ? 'text-amber-700' : 'text-red-700'}`}>
        {pct}%
      </span>
    </div>
  );
}

interface Props {
  analysis: AIAnalysis;
}

export function AIAnalysisCard({ analysis }: Props) {
  const location = [analysis.locationArea, analysis.locationCity, analysis.locationState]
    .filter(Boolean)
    .join(', ');

  const severityColors: Record<string, string> = {
    LOW: 'text-green-700 bg-green-100',
    MEDIUM: 'text-amber-700 bg-amber-100',
    HIGH: 'text-orange-700 bg-orange-100',
    CRITICAL: 'text-red-700 bg-red-100',
  };

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
          <Brain className="w-4 h-4 text-brand-600" />
        </div>
        <h3 className="font-semibold text-gray-900">AI Analysis</h3>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Category</p>
          <p className="text-sm font-medium text-gray-900">
            {CATEGORY_LABELS[analysis.category] || analysis.category}
          </p>
        </div>
        {analysis.subcategory && (
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Subcategory</p>
            <p className="text-sm font-medium text-gray-900 capitalize">
              {analysis.subcategory.replace(/_/g, ' ')}
            </p>
          </div>
        )}
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Severity</p>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${severityColors[analysis.severity] || 'bg-gray-100 text-gray-700'}`}>
            {analysis.severity}
          </span>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Urgency</p>
          <span className="text-xs font-medium text-gray-700 capitalize">
            {analysis.urgency.toLowerCase()}
          </span>
        </div>
      </div>

      {location && (
        <div className="flex items-start gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
          <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-500">Detected Location</p>
            <p className="text-sm text-gray-900">{location}</p>
          </div>
        </div>
      )}

      <div className="mb-4">
        <p className="text-xs text-gray-500 mb-0.5">Summary</p>
        <p className="text-sm text-gray-700">{analysis.summary}</p>
      </div>

      <div>
        <p className="text-xs text-gray-500 mb-1.5">AI Confidence</p>
        <ConfidenceBar value={analysis.confidence} />
      </div>

      {analysis.needsHumanReview && (
        <div className="mt-3 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-lg">
          <AlertTriangle className="w-3.5 h-3.5" />
          Flagged for human review
        </div>
      )}
    </div>
  );
}
