// test-geometries.ts
import { Vector } from '../src/lib/skeleton/Vector';

export interface GeometryConfig {
    name: string;
    description: string;
    points: Record<string, Vector>;
    adjacencyPairs: Record<string, { from: string; to: string }>;
}

export const TEST_GEOMETRIES: Record<string, GeometryConfig> = {
    complexPolygon: {
        name: 'Complex Polygon',
        description: 'Six-point polygon with various angles',
        points: {
            'A': new Vector(0, 70),
            'B': new Vector(0, 30),
            'C': new Vector(40, 30),
            'D': new Vector(40, 0),
            'E': new Vector(100, 0),
            'F': new Vector(100, 70)
        },
        adjacencyPairs: {
            'A': { from: 'F', to: 'B' },
            'B': { from: 'A', to: 'C' },
            'C': { from: 'B', to: 'D' },
            'D': { from: 'C', to: 'E' },
            'E': { from: 'D', to: 'F' },
            'F': { from: 'E', to: 'A' }
        }
    },
    
    rectangle: {
        name: 'Simple Rectangle',
        description: 'Rectangle with dimensions 8x5',
        points: {
            'A': new Vector(0, 0),  // Bottom left
            'B': new Vector(8, 0),  // Bottom right
            'C': new Vector(8, 5),  // Top right
            'D': new Vector(0, 5)   // Top left
        },
        adjacencyPairs: {
            'A': { from: 'D', to: 'B' },
            'B': { from: 'A', to: 'C' },
            'C': { from: 'B', to: 'D' },
            'D': { from: 'C', to: 'A' }
        }
    },
    
    // Add more test geometries as needed...
};