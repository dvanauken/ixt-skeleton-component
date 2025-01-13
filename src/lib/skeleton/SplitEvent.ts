import { Edge } from "./Edge";
import { Polygon } from "./Polygon";
import { Vector } from "./Vector";
import { Vertex } from "./Vertex";
import { Wavefront } from "./Wavefront";
import { Event } from "./event";

export class SplitEvent extends Event {
    constructor(
        time: number,
        public vertex: Vertex,
        public edge: Edge,
        public intersection: Vector
    ) {
        super(time);
        
        if (!vertex || !edge || !intersection) {
            throw new Error("SplitEvent requires valid vertex, edge, and intersection point");
        }

        if (!vertex.isReflex()) {
            throw new Error("Split events can only occur at reflex vertices");
        }

        if (edge.isAdjacent(vertex)) {
            throw new Error("Split edge cannot be adjacent to splitting vertex");
        }
    }
    
    override process(wavefront: Wavefront): void {
        // Validate event is still valid
        if (!this.isStillValid(wavefront)) {
            return; // Skip processing if event is no longer valid
        }
        
        // Process the split
        wavefront.handleSplitEvent(this);
    }

    private isStillValid(wavefront: Wavefront): boolean {
        const currentPolygon = wavefront.getCurrentPolygon();
        
        // Check if vertex and edge still exist in current polygon
        if (!currentPolygon.vertices.includes(this.vertex) ||
            !currentPolygon.edges.includes(this.edge)) {
            return false;
        }

        // Verify vertex is still reflex
        if (!this.vertex.isReflex()) {
            return false;
        }

        // Verify edge is still not adjacent to vertex
        if (this.edge.isAdjacent(this.vertex)) {
            return false;
        }

        // Verify bisector still intersects edge at approximately same point
        const newIntersection = this.calculateCurrentIntersection(currentPolygon);
        if (!newIntersection) {
            return false;
        }

        // Check if intersection point has significantly moved
        const distance = this.intersection.minus(newIntersection).length();
        return distance < 1e-10; // Numerical tolerance
    }

    private calculateCurrentIntersection(polygon: Polygon): Vector | null {
        // Get line equations for current state
        const p1 = this.edge.v1.position;
        const p2 = this.edge.v2.position;
        const p3 = this.vertex.position;
        const p4 = p3.plus(this.vertex.bisector);
        
        // Calculate intersection using line-line intersection formula
        const denominator = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
        
        if (Math.abs(denominator) < 1e-10) {
            return null; // Lines are parallel
        }
        
        const t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / denominator;
        
        if (t < 0 || t > 1) {
            return null; // Intersection outside edge segment
        }
        
        return new Vector(
            p1.x + t * (p2.x - p1.x),
            p1.y + t * (p2.y - p1.y)
        );
    }
}