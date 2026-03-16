import { Tier } from '../types';

export interface TierTemplate {
  name: string;
  description: string;
  tiers: Tier[];
}

export const TIER_TEMPLATES: Record<string, TierTemplate> = {
  STANDARD: {
    name: 'Standard (S-D)',
    description: 'The classic tier list format.',
    tiers: [
      { id: 's', label: 'S', color: '#ff7f7f' },
      { id: 'a', label: 'A', color: '#ffbf7f' },
      { id: 'b', label: 'B', color: '#ffff7f' },
      { id: 'c', label: 'C', color: '#7fff7f' },
      { id: 'd', label: 'D', color: '#7fbfff' },
    ],
  },
  TEN_POINT: {
    name: '10-Point Scale',
    description: 'Rank from 10 (Masterpiece) to 1 (Terrible).',
    tiers: [
      { id: '10', label: '10', color: '#ff7f7f' },
      { id: '9', label: '9', color: '#ff9f7f' },
      { id: '8', label: '8', color: '#ffbf7f' },
      { id: '7', label: '7', color: '#ffdf7f' },
      { id: '6', label: '6', color: '#ffff7f' },
      { id: '5', label: '5', color: '#dfff7f' },
      { id: '4', label: '4', color: '#bfff7f' },
      { id: '3', label: '3', color: '#9fff7f' },
      { id: '2', label: '2', color: '#7fff7f' },
      { id: '1', label: '1', color: '#7fbfff' },
    ],
  },
  ALIGNMENT: {
    name: 'Alignment Chart',
    description: 'D&D style moral alignments.',
    tiers: [
      { id: 'lg', label: 'Lawful Good', color: '#7fbfff' },
      { id: 'ng', label: 'Neutral Good', color: '#7ffffb' },
      { id: 'cg', label: 'Chaotic Good', color: '#7fffbf' },
      { id: 'ln', label: 'Lawful Neutral', color: '#bfff7f' },
      { id: 'tn', label: 'True Neutral', color: '#ffff7f' },
      { id: 'cn', label: 'Chaotic Neutral', color: '#ffdf7f' },
      { id: 'le', label: 'Lawful Evil', color: '#ffbf7f' },
      { id: 'ne', label: 'Neutral Evil', color: '#ff9f7f' },
      { id: 'ce', label: 'Chaotic Evil', color: '#ff7f7f' },
    ],
  },
  SIMPLE: {
    name: 'Simple (Love/Like/Hate)',
    description: 'Quick and easy 3-tier ranking.',
    tiers: [
      { id: 'love', label: 'Love it', color: '#7fff7f' },
      { id: 'like', label: 'Like it', color: '#ffff7f' },
      { id: 'hate', label: 'Hate it', color: '#ff7f7f' },
    ],
  },
  SCHOOL: {
    name: 'School Grades',
    description: 'A+ through F grading scale.',
    tiers: [
      { id: 'aplus', label: 'A+', color: '#ff7f7f' },
      { id: 'a', label: 'A', color: '#ff9f7f' },
      { id: 'b', label: 'B', color: '#ffbf7f' },
      { id: 'c', label: 'C', color: '#ffff7f' },
      { id: 'd', label: 'D', color: '#bfff7f' },
      { id: 'f', label: 'F', color: '#7fbfff' },
    ]
  }
};
