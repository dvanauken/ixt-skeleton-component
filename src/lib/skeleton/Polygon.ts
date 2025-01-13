import { Edge } from "./Edge";
import { Vector } from "./Vector";
import { Vertex } from "./Vertex";

export class Polygon {
    vertices: Vertex[];
    edges: Edge[];

    constructor(points: Vector[]) {
        if (points.length < 3) {
            throw new Error("Polygon must have at least 3 points");
        }
        this.vertices = points.map(p => new Vertex(p));
        this.edges = [];
        this.initialize();
    }

    initialize(): void {
        const n = this.vertices.length;

        // Link vertices in CCW order
        for (let i = 0; i < n; i++) {
            this.vertices[i].prev = this.vertices[(i - 1 + n) % n];
            this.vertices[i].next = this.vertices[(i + 1) % n];
        }

        // Create edges
        this.edges = [];
        for (let i = 0; i < n; i++) {
            this.edges.push(new Edge(
                this.vertices[i],
                this.vertices[(i + 1) % n]
            ));
        }

        // Calculate vertex bisectors
        for (let vertex of this.vertices) {
            // Get vectors pointing AWAY from vertex
            const toPrev = new Vector(
                vertex.prev!.position.x - vertex.position.x,
                vertex.prev!.position.y - vertex.position.y
            ).normalize();
            
            const toNext = new Vector(
                vertex.next!.position.x - vertex.position.x,
                vertex.next!.position.y - vertex.position.y
            ).normalize();

            // Bisector is sum of normalized vectors
            vertex.bisector = toPrev.plus(toNext).normalize();
        }
    }

    isSimple(): boolean {
        // Check for intersections between non-adjacent edges
        for (let i = 0; i < this.edges.length; i++) {
            for (let j = i + 2; j < this.edges.length; j++) {
                // Skip adjacent edges
                if (i === 0 && j === this.edges.length - 1) continue;
                
                const edge1 = this.edges[i];
                const edge2 = this.edges[j];

                // Check if edges intersect
                const v1 = edge1.v1.position;
                const v2 = edge1.v2.position;
                const v3 = edge2.v1.position;
                const v4 = edge2.v2.position;

                // Using cross products to determine intersection
                const d1 = sign((v4.x - v3.x) * (v1.y - v3.y) - (v4.y - v3.y) * (v1.x - v3.x));
                const d2 = sign((v4.x - v3.x) * (v2.y - v3.y) - (v4.y - v3.y) * (v2.x - v3.x));
                const d3 = sign((v2.x - v1.x) * (v3.y - v1.y) - (v2.y - v1.y) * (v3.x - v1.x));
                const d4 = sign((v2.x - v1.x) * (v4.y - v1.y) - (v2.y - v1.y) * (v4.x - v1.x));

                if (d1 !== d2 && d3 !== d4) {
                    return false; // Found an intersection
                }
            }
        }
        return true;
    }

    isClockwise(): boolean {
        // Calculate signed area - positive for CCW, negative for CW
        return this.area() < 0;
    }

    area(): number {
        let area = 0;
        // Using shoelace formula (also known as surveyor's formula)
        for (let i = 0; i < this.vertices.length; i++) {
            const j = (i + 1) % this.vertices.length;
            const vi = this.vertices[i].position;
            const vj = this.vertices[j].position;
            area += vi.x * vj.y - vj.x * vi.y;
        }
        return area / 2;
    }

    clone(): Polygon {
        // Create new polygon with cloned points
        const clonedPoints = this.vertices.map(v => v.position.clone());
        const newPolygon = new Polygon(clonedPoints);
        
        // The initialize() call in constructor will handle:
        // - Linking vertices
        // - Creating edges
        // - Calculating bisectors
        
        return newPolygon;
    }
}

// Helper function for isSimple()
function sign(num: number): number {
    return num < 0 ? -1 : num > 0 ? 1 : 0;
}