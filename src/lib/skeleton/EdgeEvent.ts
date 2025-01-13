import { Edge } from "./Edge";
import { Event } from "./Event";
import { Wavefront } from "./Wavefront";

export class EdgeEvent extends Event {
    constructor(
        time: number,
        public edge: Edge
    ) {
        super(time);
        
        if (!edge) {
            throw new Error("EdgeEvent requires a valid edge");
        }

        if (edge.hasReflexEndpoint()) {
            throw new Error("Edge cannot have reflex vertices for edge event");
        }
    }
    
    override process(wavefront: Wavefront): void {
        // Validate edge still exists and is valid
        if (!this.isStillValid(wavefront)) {
            return; // Skip processing if edge is no longer valid
        }
        
        // Process the edge collapse
        wavefront.handleEdgeEvent(this);
    }

    private isStillValid(wavefront: Wavefront): boolean {
        const currentPolygon = wavefront.getCurrentPolygon();
        
        // Check if edge still exists in current polygon
        if (!currentPolygon.edges.includes(this.edge)) {
            return false;
        }

        // Check if vertices are still valid
        if (!currentPolygon.vertices.includes(this.edge.v1) ||
            !currentPolygon.vertices.includes(this.edge.v2)) {
            return false;
        }

        // Check if vertices are still not reflex
        if (this.edge.hasReflexEndpoint()) {
            return false;
        }

        return true;
    }
}