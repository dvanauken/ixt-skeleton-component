import { Vector } from "./Vector";
import { Vertex } from "./Vertex";

export class Edge {
    v1: Vertex;
    v2: Vertex;
    
    constructor(v1: Vertex, v2: Vertex) {
        if (!v1 || !v2) {
            throw new Error("Edge must have two valid vertices");
        }
        this.v1 = v1;
        this.v2 = v2;
    }
    
    length(): number {
        // Calculate Euclidean distance between vertices
        return new Vector(
            this.v2.position.x - this.v1.position.x,
            this.v2.position.y - this.v1.position.y
        ).length();
    }
    
    direction(): Vector {
        // Returns normalized vector from v1 to v2
        return new Vector(
            this.v2.position.x - this.v1.position.x,
            this.v2.position.y - this.v1.position.y
        ).normalize();
    }
    
    hasReflexEndpoint(): boolean {
        // An edge can't be part of an edge event if either endpoint is reflex
        return this.v1.isReflex() || this.v2.isReflex();
    }
    
    isAdjacent(vertex: Vertex): boolean {
        // Check if the vertex is one of the endpoints
        // or adjacent to either endpoint in the polygon
        return vertex === this.v1 || 
               vertex === this.v2 ||
               vertex === this.v1.next ||
               vertex === this.v1.prev ||
               vertex === this.v2.next ||
               vertex === this.v2.prev;
    }
    
    clone(): Edge {
        // Note: this creates a new edge with references to the same vertices
        // The calling code should update these references as needed
        return new Edge(this.v1, this.v2);
    }
}