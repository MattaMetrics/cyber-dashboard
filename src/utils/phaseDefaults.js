/** Shared default combat phases — used by report builders and parsers */
export const DEFAULT_PHASES = [
  {
    title: 'PHASE 1 // COMBAT STANCE',
    duration: '10 SECONDS',
    imageUrl: '',
    metrics: [
      { label: 'BALANCE INDEX', val: '1.000', target: 'Optimal' },
      { label: 'CENTER OF MASS', val: '50.0%', target: 'Balanced' },
      { label: 'SYMMETRY SCORE', val: '100.0%', target: 'Perfect' },
    ],
    alignments: [
      'HEAD ALIGNMENT: 0.0°',
      'SHOULDER ALIGNMENT: 0.0°',
      'HIP ALIGNMENT: 0.0°',
    ],
  },
  {
    title: 'PHASE 2 // CROSS PUNCH',
    duration: '10 SECONDS',
    imageUrl: '',
    metrics: [
      { label: 'SHOULDER TURN', val: '94.0°', target: 'Target >90°' },
      { label: 'ELBOW EXTENSION', val: '180.0°', target: 'Full Extension' },
      { label: 'LOAD DISTRIBUTION', val: '0.55', target: 'Nominal' },
    ],
    alignments: [
      'SHOULDER TURN: 94.0°',
      'KNEE FLEXION: 15.0°',
      'SPINAL ROTATION: 20.0°',
    ],
  },
  {
    title: 'PHASE 3 // KNEE STRIKE',
    duration: '10 SECONDS',
    imageUrl: '',
    metrics: [
      { label: 'KNEE FLEXION', val: '91.2°', target: 'Target 85°-95°' },
      { label: 'HIP FLEXION', val: '90.0°', target: 'Target >80°' },
      { label: 'BALANCE INDEX', val: '0.94', target: 'Stable' },
    ],
    alignments: [
      'KNEE FLEXION: 91.2°',
      'ANKLE PLANTAR FLEX: 20.0°',
      'SPINAL FLEXION: 10.0°',
    ],
  },
];
