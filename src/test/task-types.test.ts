import { describe, expect, it } from 'vitest';
import { getQuadrant, getQuadrantFlags, PRESET_TAGS } from '@/types/task';

describe('task type helpers', () => {
  it('maps urgent + important to do quadrant', () => {
    expect(getQuadrant(true, true)).toBe('do');
  });

  it('maps not urgent + important to schedule quadrant', () => {
    expect(getQuadrant(false, true)).toBe('schedule');
  });

  it('maps urgent + not important to delegate quadrant', () => {
    expect(getQuadrant(true, false)).toBe('delegate');
  });

  it('maps not urgent + not important to hold quadrant', () => {
    expect(getQuadrant(false, false)).toBe('hold');
  });

  it('returns flags for do quadrant', () => {
    expect(getQuadrantFlags('do')).toEqual({ urgent: true, important: true });
  });

  it('returns flags for schedule quadrant', () => {
    expect(getQuadrantFlags('schedule')).toEqual({ urgent: false, important: true });
  });

  it('returns flags for delegate quadrant', () => {
    expect(getQuadrantFlags('delegate')).toEqual({ urgent: true, important: false });
  });

  it('returns flags for hold quadrant', () => {
    expect(getQuadrantFlags('hold')).toEqual({ urgent: false, important: false });
  });

  it('includes six preset tags', () => {
    expect(PRESET_TAGS).toHaveLength(6);
  });

  it('contains required preset tag names', () => {
    const names = PRESET_TAGS.map((tag) => tag.name);
    expect(names).toEqual(['Work', 'Personal', 'Health', 'Finance', 'Learning', 'Home']);
  });
});
