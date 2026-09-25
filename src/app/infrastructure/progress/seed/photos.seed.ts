import { PhotoAngle, ProgressPhoto } from '@app/domain/progress/model/progress-photo.model';

/**
 * Marcadores SVG en data-URI en vez de binarios.
 *
 * Mantiene el repo sin imagenes de prueba y deja el swap listo: cuando el
 * BFF entregue URLs reales, solo cambia el adapter.
 */
function placeholder(label: string, tone: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400">
<rect width="300" height="400" fill="hsl(172 ${tone}% 92%)"/>
<circle cx="150" cy="140" r="46" fill="hsl(172 ${tone}% 78%)"/>
<rect x="104" y="196" width="92" height="140" rx="30" fill="hsl(172 ${tone}% 78%)"/>
<text x="150" y="372" text-anchor="middle" font-family="sans-serif" font-size="22" fill="hsl(172 30% 38%)">${label}</text>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

interface PhotoSeedInput {
  readonly id: string;
  readonly takenAt: string;
  readonly angle: PhotoAngle;
  readonly weightKg: number;
  readonly tone: number;
}

const INPUTS: readonly PhotoSeedInput[] = [
  { id: 'pht-001', takenAt: '2026-03-05T09:00:00.000Z', angle: 'front', weightKg: 61.4, tone: 30 },
  { id: 'pht-002', takenAt: '2026-03-05T09:01:00.000Z', angle: 'side', weightKg: 61.4, tone: 34 },
  { id: 'pht-003', takenAt: '2026-06-04T09:00:00.000Z', angle: 'front', weightKg: 60.0, tone: 42 },
  { id: 'pht-004', takenAt: '2026-06-04T09:01:00.000Z', angle: 'side', weightKg: 60.0, tone: 46 },
  { id: 'pht-005', takenAt: '2026-09-07T09:00:00.000Z', angle: 'front', weightKg: 58.9, tone: 54 },
  { id: 'pht-006', takenAt: '2026-09-07T09:01:00.000Z', angle: 'side', weightKg: 58.9, tone: 58 },
];

export const SEED_PROGRESS_PHOTOS: readonly ProgressPhoto[] = INPUTS.map(input => ({
  id: input.id,
  studentId: 'std-001',
  takenAt: input.takenAt,
  url: placeholder(input.takenAt.slice(0, 7), input.tone),
  angle: input.angle,
  weightKg: input.weightKg,
  note: null,
}));
