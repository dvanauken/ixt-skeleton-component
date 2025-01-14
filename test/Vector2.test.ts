// Vector.test.ts
import { describe, test, expect } from 'vitest';
import { Vector } from '../src/lib/skeleton/Vector';
import { Angle } from '../src/lib/skeleton/Angle';
import { TEST_GEOMETRIES } from './TestGeometries';

// Define which geometry tests to run
const GEOMETRIES_TO_TEST = ['Simple Rectangle', 'Complex Polygon'];

describe('Vector Angle Tests', () => {
    // Filter geometries by name property
    Object.entries(TEST_GEOMETRIES)
        .filter(([_, geometry]) => GEOMETRIES_TO_TEST.includes(geometry.name))
        .forEach(([geometryKey, geometry]) => {
            describe(`Testing ${geometry.name}`, () => {
                test('output all angles', () => {
                    console.log(`\nTesting geometry: ${geometry.name}`);
                    console.log(geometry.description);
                    
                    Object.entries(geometry.adjacencyPairs).forEach(([point, {from, to}]) => {
                        const vectorFrom = new Vector(
                            geometry.points[from].x - geometry.points[point].x,
                            geometry.points[from].y - geometry.points[point].y
                        );
                        const vectorTo = new Vector(
                            geometry.points[to].x - geometry.points[point].x,
                            geometry.points[to].y - geometry.points[point].y
                        );
                        
                        console.log(`\nPoint ${point}`);
                        console.log(`  Vector ${from}->${point}: ${Angle.fromVector(vectorFrom).toDegrees().toFixed(2)}°`);
                        console.log(`  Vector ${point}->${to}: ${Angle.fromVector(vectorTo).toDegrees().toFixed(2)}°`);
                        console.log(`  Interior angle: ${Angle.between(vectorFrom, vectorTo).toDegrees().toFixed(2)}°`);
                    });
                });
            });
        });
});