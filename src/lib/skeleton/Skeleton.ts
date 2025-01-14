import { Event } from "./Event";
import { EdgeEvent } from "./EdgeEvent";
import { SplitEvent } from "./SplitEvent";
import { EventQueue } from "./EventQueue";
import { Polygon } from "./Polygon";
import { Vector } from "./Vector";
import { Vertex } from "./Vertex";
import { Edge } from "./Edge";
import { Angle } from "./Angle";

export class Skeleton {
    private readonly BISECTOR_VELOCITY = 1;
    private readonly NUMERICAL_TOLERANCE = 1e-10;
    private eventQueue: EventQueue;
    private wavefrontPolygons: Polygon[] = [];
    private angleBisectorEdges: Edge[] = [];
    private skeletonEdges: Edge[] = [];
    private debugLog: string[] = [];

    private constructor(polygon: Polygon) {
        this.log("Starting skeleton construction");
        
        if (!polygon) {
            throw new Error("Input polygon cannot be null or undefined");
        }

        this.log(`Input polygon has ${polygon.vertices.length} vertices`);
        this.validateInputPolygon(polygon);
        
        this.eventQueue = new EventQueue();
        this.wavefrontPolygons.push(polygon.clone());
        
        try {
            this.initialize(polygon);
        } catch (error) {
            this.log("ERROR during initialization: " + error);
            throw error;
        }
    }

    private validateInputPolygon(polygon: Polygon): void {
        if (polygon.vertices.length < 3) {
            throw new Error(`Invalid polygon: only ${polygon.vertices.length} vertices (minimum 3 required)`);
        }

        if (!polygon.isSimple()) {
            throw new Error("Invalid polygon: contains self-intersections");
        }

        // Validate vertex connectivity
        for (const vertex of polygon.vertices) {
            if (!vertex.prev || !vertex.next) {
                throw new Error("Invalid polygon: vertices not properly linked");
            }
        }

        // Validate edge connectivity
        for (const edge of polygon.edges) {
            if (!edge.v1 || !edge.v2) {
                throw new Error("Invalid polygon: edges not properly defined");
            }
        }

        this.log("Input polygon validation successful");
    }

    private log(message: string): void {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${message}`;
        this.debugLog.push(logMessage);
        console.log(logMessage);
    }

    static build(polygon: Polygon): Skeleton {
        return new Skeleton(polygon);
    }

    private initialize(polygon: Polygon): void {
        this.log("Starting initialization phase");
        
        // Calculate and store initial bisectors
        this.log("Computing initial angle bisectors");
        try {
            this.computeInitialBisectors(polygon);
        } catch (error) {
            this.log("ERROR during bisector computation: " + error);
            throw new Error(`Failed to compute initial bisectors: ${error}`);
        }

        // Handle edge events
        this.log("Computing edge events");
        try {
            this.computeInitialEdgeEvents(polygon);
        } catch (error) {
            this.log("ERROR during edge event computation: " + error);
            throw new Error(`Failed to compute edge events: ${error}`);
        }

        // Handle split events
        this.log("Computing split events");
        try {
            this.computeInitialSplitEvents(polygon);
        } catch (error) {
            this.log("ERROR during split event computation: " + error);
            throw new Error(`Failed to compute split events: ${error}`);
        }
    }

    private computeInitialBisectors(polygon: Polygon): void {
        for (const vertex of polygon.vertices) {
            this.log(`Computing bisector for vertex at (${vertex.position.x}, ${vertex.position.y})`);
            
            if (!vertex.prev || !vertex.next) {
                throw new Error(`Invalid vertex links at (${vertex.position.x}, ${vertex.position.y})`);
            }

            try {
                const bisector = this.calculateBisector(vertex);
                this.log(`Computed bisector direction: (${bisector.x}, ${bisector.y})`);

                // Validate bisector is unit length
                const length = bisector.length();
                if (Math.abs(length - 1) > this.NUMERICAL_TOLERANCE) {
                    throw new Error(`Invalid bisector length: ${length}`);
                }

                // Create and store bisector edge
                const bisectorLength = 10; // Arbitrary length for visualization
                const bisectorEnd = vertex.position.plus(bisector.scale(bisectorLength));
                
                const bisectorEdge = new Edge(
                    new Vertex(vertex.position),
                    new Vertex(bisectorEnd)
                );
                
                this.angleBisectorEdges.push(bisectorEdge);
                this.log(`Stored bisector edge from (${vertex.position.x}, ${vertex.position.y}) to (${bisectorEnd.x}, ${bisectorEnd.y})`);

            } catch (error) {
                throw new Error(`Failed to compute bisector at (${vertex.position.x}, ${vertex.position.y}): ${error}`);
            }
        }
        
        this.log(`Successfully computed ${this.angleBisectorEdges.length} bisectors`);
    }

    private calculateBisector(vertex: Vertex): Vector {
        this.log(`Calculating bisector for vertex at (${vertex.position.x}, ${vertex.position.y})`);
        
        if (!vertex.prev || !vertex.next) {
            throw new Error("Vertex missing prev/next references");
        }

        // Get vectors pointing AWAY from vertex
        const prevVector = vertex.position.minus(vertex.prev.position);
        const nextVector = vertex.next.position.minus(vertex.position);

        this.log(`Previous edge vector: (${prevVector.x}, ${prevVector.y})`);
        this.log(`Next edge vector: (${nextVector.x}, ${nextVector.y})`);

        // Normalize vectors
        try {
            const normalizedPrev = prevVector.normalize();
            const normalizedNext = nextVector.normalize();
            
            this.log(`Normalized prev vector: (${normalizedPrev.x}, ${normalizedPrev.y})`);
            this.log(`Normalized next vector: (${normalizedNext.x}, ${normalizedNext.y})`);

            // Compute bisector
            const bisector = normalizedPrev.plus(normalizedNext).normalize();
            this.log(`Computed bisector: (${bisector.x}, ${bisector.y})`);

            return bisector;

        } catch (error) {
            throw new Error(`Normalization failed: ${error}`);
        }
    }

    private computeInitialEdgeEvents(polygon: Polygon): void {
        this.log("Starting edge event computation");
        
        for (const edge of polygon.edges) {
            this.log(`Analyzing edge from (${edge.v1.position.x}, ${edge.v1.position.y}) to (${edge.v2.position.x}, ${edge.v2.position.y})`);

            try {
                if (edge.hasReflexEndpoint()) {
                    this.log("Edge has reflex endpoint - skipping");
                    continue;
                }

                const time = this.calculateEdgeCollapseTime(edge);
                this.log(`Calculated collapse time: ${time}`);

                if (time <= 0) {
                    this.log("Invalid collapse time (<=0) - skipping");
                    continue;
                }

                if (!isFinite(time)) {
                    this.log("Invalid collapse time (not finite) - skipping");
                    continue;
                }

                this.eventQueue.add(new EdgeEvent(time, edge));
                this.log(`Added edge event at time ${time}`);

            } catch (error) {
                this.log(`ERROR processing edge: ${error}`);
                throw new Error(`Failed to process edge event: ${error}`);
            }
        }

        this.log(`Edge event computation complete. Queue size: ${this.eventQueue.size()}`);
    }

    private calculateEdgeCollapseTime(edge: Edge): number {
        this.log(`Calculating collapse time for edge from (${edge.v1.position.x}, ${edge.v1.position.y}) to (${edge.v2.position.x}, ${edge.v2.position.y})`);

        try {
            const edgeVector = edge.direction();
            this.log(`Edge direction vector: (${edgeVector.x}, ${edgeVector.y})`);

            const theta1 = Angle.between(edgeVector, edge.v1.bisector);
            const theta2 = Angle.between(edgeVector, edge.v2.bisector);

            this.log(`Angle at v1: ${theta1.toDegrees().toFixed(2)} degrees`);
            this.log(`Angle at v2: ${theta2.toDegrees().toFixed(2)} degrees`);

            const sin1 = theta1.sin();
            const sin2 = theta2.sin();

            if (Math.abs(sin1) < this.NUMERICAL_TOLERANCE || Math.abs(sin2) < this.NUMERICAL_TOLERANCE) {
                throw new Error("Angle sine too close to zero");
            }

            const velocity = (1 / sin1) + (1 / sin2);
            const length = edge.length();
            const time = length / velocity;

            this.log(`Edge length: ${length}`);
            this.log(`Computed velocity: ${velocity}`);
            this.log(`Computed collapse time: ${time}`);

            return time;

        } catch (error) {
            throw new Error(`Edge collapse time calculation failed: ${error}`);
        }
    }

    private computeInitialSplitEvents(polygon: Polygon): void {
        this.log("Starting split event computation");
        
        for (const vertex of polygon.vertices) {
            if (!vertex.isReflex()) {
                continue;
            }

            this.log(`Processing reflex vertex at (${vertex.position.x}, ${vertex.position.y})`);
            const bisector = this.calculateBisector(vertex);
            
            for (const edge of polygon.edges) {
                if (this.isNearbyEdge(edge, vertex)) {
                    continue;
                }

                try {
                    const intersection = this.calculateIntersection(vertex, bisector, edge);
                    if (!intersection) {
                        continue;
                    }

                    const distance = this.distance(vertex.position, intersection);
                    const time = distance / this.BISECTOR_VELOCITY;

                    if (time <= 0 || !isFinite(time)) {
                        continue;
                    }

                    this.eventQueue.add(new SplitEvent(time, vertex, edge, intersection));
                    this.log(`Added split event at time ${time} for intersection (${intersection.x}, ${intersection.y})`);

                } catch (error) {
                    this.log(`WARNING: Failed to process potential split event: ${error}`);
                    // Continue processing other edges
                }
            }
        }

        this.log(`Split event computation complete. Queue size: ${this.eventQueue.size()}`);
    }

    private isNearbyEdge(edge: Edge, vertex: Vertex): boolean {
        return edge.isAdjacent(vertex);
    }

    private calculateIntersection(vertex: Vertex, bisector: Vector, edge: Edge): Vector | null {
        const p1 = edge.v1.position;
        const p2 = edge.v2.position;
        const p3 = vertex.position;
        const p4 = vertex.position.plus(bisector);

        const denominator = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
        
        if (Math.abs(denominator) < this.NUMERICAL_TOLERANCE) {
            return null;
        }

        const t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / denominator;
        
        if (t < 0 || t > 1) {
            return null;
        }

        return new Vector(
            p1.x + t * (p2.x - p1.x),
            p1.y + t * (p2.y - p1.y)
        );
    }

    private distance(p1: Vector, p2: Vector): number {
        return p1.minus(p2).length();
    }

    private processEvents(): void {
        this.log("Starting event processing");
        
        while (!this.eventQueue.isEmpty()) {
            const event = this.eventQueue.poll();
            if (!event) {
                this.log("WARNING: Null event encountered in queue");
                continue;
            }

            try {
                if (event instanceof EdgeEvent) {
                    this.log(`Processing edge event at time ${event.time}`);
                    this.handleEdgeEvent(event);
                } else if (event instanceof SplitEvent) {
                    this.log(`Processing split event at time ${event.time}`);
                    this.handleSplitEvent(event);
                } else {
                    this.log(`WARNING: Unknown event type encountered: ${event.constructor.name}`);
                    continue;
                }

                // Store polygon state after each event
                const currentPolygon = this.getCurrentPolygon();
                if (currentPolygon) {
                    this.wavefrontPolygons.push(currentPolygon.clone());
                    this.log(`Stored wavefront polygon with ${currentPolygon.vertices.length} vertices`);
                }

            } catch (error) {
                this.log(`ERROR processing event at time ${event.time}: ${error}`);
                // Continue processing other events
            }
        }

        this.log("Event processing complete");
    }

    private handleEdgeEvent(event: EdgeEvent): void {
        if (!this.validateEventState(event)) {
            return;
        }

        // Store the collapsed edge as part of the skeleton
        this.skeletonEdges.push(event.edge.clone());
        this.log(`Added edge to skeleton: (${event.edge.v1.position.x}, ${event.edge.v1.position.y}) to (${event.edge.v2.position.x}, ${event.edge.v2.position.y})`);
        
        // Update polygon state
        const currentPolygon = this.getCurrentPolygon();
        if (!currentPolygon) {
            this.log("WARNING: No current polygon state available");
            return;
        }

        const v1 = event.edge.v1;
        const v2 = event.edge.v2;

        // Remove vertices and edge
        currentPolygon.vertices = currentPolygon.vertices.filter(v => v !== v1 && v !== v2);
        currentPolygon.edges = currentPolygon.edges.filter(e => e !== event.edge);
        
        // Reinitialize the polygon
        try {
            currentPolygon.initialize();
            this.log(`Updated polygon state: ${currentPolygon.vertices.length} vertices remaining`);
        } catch (error) {
            throw new Error(`Failed to reinitialize polygon: ${error}`);
        }
    }

    private handleSplitEvent(event: SplitEvent): void {
        if (!this.validateEventState(event)) {
            return;
        }

        // Store the split edge as part of the skeleton
        const skeletonEdge = new Edge(
            new Vertex(event.vertex.position),
            new Vertex(event.intersection)
        );
        this.skeletonEdges.push(skeletonEdge);
        this.log(`Added split edge to skeleton: (${event.vertex.position.x}, ${event.vertex.position.y}) to (${event.intersection.x}, ${event.intersection.y})`);
        
        // Update polygon state
        const currentPolygon = this.getCurrentPolygon();
        if (!currentPolygon) {
            this.log("WARNING: No current polygon state available");
            return;
        }

        // Create new vertex at intersection
        const newVertex = new Vertex(event.intersection);
        
        // Split the edge
        const edgeIndex = currentPolygon.edges.indexOf(event.edge);
        const vertexIndex = currentPolygon.vertices.indexOf(event.vertex);
        
        if (edgeIndex === -1 || vertexIndex === -1) {
            throw new Error("Invalid split event: edge or vertex not found in current polygon");
        }

        currentPolygon.vertices.splice(vertexIndex + 1, 0, newVertex);
        currentPolygon.edges.splice(edgeIndex + 1, 0, new Edge(event.vertex, newVertex));
        
        try {
            currentPolygon.initialize();
            this.log(`Updated polygon state after split: ${currentPolygon.vertices.length} vertices`);
        } catch (error) {
            throw new Error(`Failed to reinitialize polygon after split: ${error}`);
        }
    }

    private validateEventState(event: EdgeEvent | SplitEvent): boolean {
        const currentPolygon = this.getCurrentPolygon();
        if (!currentPolygon) {
            this.log("ERROR: No current polygon state available");
            return false;
        }

        if (event instanceof EdgeEvent) {
            if (!currentPolygon.edges.includes(event.edge)) {
                this.log("ERROR: Edge event references non-existent edge");
                return false;
            }
        } else if (event instanceof SplitEvent) {
            if (!currentPolygon.vertices.includes(event.vertex) || 
                !currentPolygon.edges.includes(event.edge)) {
                this.log("ERROR: Split event references non-existent vertex or edge");
                return false;
            }
        }

        return true;
    }

    private getCurrentPolygon(): Polygon | null {
        return this.wavefrontPolygons.length > 0 ? 
            this.wavefrontPolygons[this.wavefrontPolygons.length - 1] : null;
    }

    // Public interface methods
    getWavefrontPolygons(): Polygon[] {
        return this.wavefrontPolygons.map(p => p.clone());
    }

    getAngleBisectors(): Edge[] {
        return this.angleBisectorEdges.map(e => e.clone());
    }

    getSkeletonEdges(): Edge[] {
        return this.skeletonEdges.map(e => e.clone());
    }

    getDebugLog(): string[] {
        return [...this.debugLog];
    }
}