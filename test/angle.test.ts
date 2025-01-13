import { describe, it, expect } from 'vitest';
import { Angle } from '../src/lib/skeleton/Angle';

describe('Angle', () => {
  it('should create an Angle from radians', () => {
    const angle = Angle.fromRadians(Math.PI / 2);
    expect(angle.toRadians()).toBeCloseTo(Math.PI / 2);
  });
});
