import { Edge } from "./Edge";
import { EdgeEvent } from "./EdgeEvent";
import { Polygon } from "./Polygon";
import { SplitEvent } from "./SplitEvent";
import { Vertex } from "./Vertex";

export class Wavefront {
    private polygons: Polygon[];  // History of polygon states
    private times: number[];      // Corresponding times for each state
    
    constructor(original: Polygon) {
        if (!original.isSimple()) {
            throw new Error("Initial polygon must be simple (no self-intersections)");
        }
        
        this.polygons = [original.clone()];
        this.times = [0];  // Initial state at time 0
    }
    
    propagateToTime(targetTime: number): void {
        if (targetTime < 0) {
            throw new Error("Target time cannot be negative");
        }
        
        const lastTime = this.times[this.times.length - 1];
        if (targetTime <= lastTime) {
            return; // Already propagated to this time or later
        }
        
        // Create new state at target time
        const lastPolygon = this.polygons[this.polygons.length - 1];
        const newPolygon = lastPolygon.clone();
        
        // Store new state
        this.polygons.push(newPolygon);
        this.times.push(targetTime);
    }
    
    getCurrentPolygon(): Polygon {
        if (this.polygons.length === 0) {
            throw new Error("No polygon states exist");
        }
        return this.polygons[this.polygons.length - 1];
    }
    
    getPolygonAtTime(time: number): Polygon {
        if (time < 0) {
            throw new Error("Time cannot be negative");
        }
        
        // Find the latest state that's not after the requested time
        for (let i = this.times.length - 1; i >= 0; i--) {
            if (this.times[i] <= time) {
                return this.polygons[i].clone();
            }
        }
        
        throw new Error("No polygon state exists for the requested time");
    }
    
    handleEdgeEvent(event: EdgeEvent): void {
        // Propagate to event time first
        //this.propagateToTime(event.time);  //TOOD ... TIME
        
        const currentPolygon = this.getCurrentPolygon();
        const edge = event.edge;
        
        // Remove the collapsed edge and update topology
        const v1 = edge.v1;
        const v2 = edge.v2;
        
        // Find indices to update vertex and edge lists
        const vertexIndex = currentPolygon.vertices.findIndex(v => v === v1);
        const edgeIndex = currentPolygon.edges.findIndex(e => e === edge);
        
        if (vertexIndex === -1 || edgeIndex === -1) {
            throw new Error("Edge event references invalid geometry");
        }
        
        // Update vertex links
        currentPolygon.vertices.splice(vertexIndex, 2);
        currentPolygon.edges.splice(edgeIndex, 1);
        
        // Reinitialize the polygon to update all links and bisectors
        currentPolygon.initialize();
    }
    
    handleSplitEvent(event: SplitEvent): void {
        // Propagate to event time first
        //this.propagateToTime(event.time); //TODO... FIX
        
        const currentPolygon = this.getCurrentPolygon();
        
        // Create new vertex at intersection point
        const newVertex = new Vertex(event.intersection);
        
        // Split the edge and update topology
        const splitEdge = event.edge;
        const splitVertex = event.vertex;
        
        // Find indices
        const edgeIndex = currentPolygon.edges.findIndex(e => e === splitEdge);
        const vertexIndex = currentPolygon.vertices.findIndex(v => v === splitVertex);
        
        if (edgeIndex === -1 || vertexIndex === -1) {
            throw new Error("Split event references invalid geometry");
        }
        
        // Insert new vertex into vertices list
        currentPolygon.vertices.splice(vertexIndex + 1, 0, newVertex);
        
        // Create new edge
        const newEdge = new Edge(splitVertex, newVertex);
        currentPolygon.edges.splice(edgeIndex + 1, 0, newEdge);
        
        // Reinitialize the polygon to update all links and bisectors
        currentPolygon.initialize();
    }
    
    validateState(): boolean {
        // Check if we have consistent history
        if (this.polygons.length !== this.times.length) {
            return false;
        }
        
        // Check if times are strictly increasing
        for (let i = 1; i < this.times.length; i++) {
            if (this.times[i] <= this.times[i - 1]) {
                return false;
            }
        }
        
        // Validate current polygon
        const current = this.getCurrentPolygon();
        
        // Check if all vertices have proper links
        for (const vertex of current.vertices) {
            if (!vertex.prev || !vertex.next || !vertex.bisector) {
                return false;
            }
        }
        
        // Check if all edges reference valid vertices
        for (const edge of current.edges) {
            if (!current.vertices.includes(edge.v1) || 
                !current.vertices.includes(edge.v2)) {
                return false;
            }
        }
        
        // Check if polygon is still simple
        return current.isSimple();
    }
}