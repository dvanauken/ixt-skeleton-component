import { describe, test, expect } from 'vitest';
import { Vector } from '../src/lib/skeleton/Vector';

describe('Vector Angles', () => {
    type PointKey = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

    const points: Record<PointKey, Vector> = {
        A: new Vector(0, 70),
        B: new Vector(0, 30),
        C: new Vector(40, 30),
        D: new Vector(40, 0),
        E: new Vector(100, 0),
        F: new Vector(100, 70)
    };

    const adjacencyPairs: Record<PointKey, { from: PointKey; to: PointKey }> = {
        A: { from: 'F', to: 'B' },
        B: { from: 'A', to: 'C' },
        C: { from: 'B', to: 'D' },
        D: { from: 'C', to: 'E' },
        E: { from: 'D', to: 'F' },
        F: { from: 'E', to: 'A' }
    };

    function vectorToDegrees(v: Vector): number {
        let deg = Math.atan2(v.y, v.x) * (180 / Math.PI);
        if (deg < 0) deg += 360;
        return deg;
    }

    test('output all angles', () => {
        Object.entries(adjacencyPairs).forEach(([point, {from, to}]) => {
            const pointKey = point as PointKey;
            
            // Following CCW order:
            const vectorFrom = new Vector(
                points[from].x - points[pointKey].x,  // Vector TO current point
                points[from].y - points[pointKey].y
            );
            const vectorTo = new Vector(
                points[to].x - points[pointKey].x,    // Vector FROM current point
                points[to].y - points[pointKey].y
            );
            
            console.log(`Point ${point}`);
            console.log(`  Vector ${from}->${point}: ${vectorToDegrees(vectorFrom).toFixed(2)}°`);
            console.log(`  Vector ${point}->${to}: ${vectorToDegrees(vectorTo).toFixed(2)}°`);
            console.log(`  Interior angle: ${vectorToDegrees(Vector.bisector(vectorFrom, vectorTo)).toFixed(2)}°`);
            console.log('');
        });
    });
});