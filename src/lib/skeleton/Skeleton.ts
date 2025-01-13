import { Event } from "./Event";
import { EdgeEvent } from "./EdgeEvent";
import { SplitEvent } from "./SplitEvent";
import { EventQueue } from "./EventQueue";
import { Polygon } from "./Polygon";
import { Vector } from "./Vector";
import { Vertex } from "./Vertex";
import { Wavefront } from "./Wavefront";
import { Edge } from "./Edge";
import { Angle } from "./Angle";

export class Skeleton {
    private wavefront: Wavefront;
    private eventQueue: EventQueue;
    readonly edges: Edge[] = [];
    readonly events: Event[] = [];

    constructor(polygon: Polygon) {
        if (!polygon.isSimple()) {
            throw new Error("Initial polygon must be simple (no self-intersections)");
        }
        this.wavefront = new Wavefront(polygon);
        this.eventQueue = new EventQueue();
        this.initializeEvents();
    }

    static build(polygon: Polygon): Skeleton {
        return new Skeleton(polygon);
    }

    private initializeEvents(): void {
        const polygon = this.wavefront.getCurrentPolygon();

        // Add initial edge events
        for (const edge of polygon.edges) {
            if (!edge.hasReflexEndpoint()) {
                const time = this.calculateEdgeCollapseTime(edge);
                if (time > 0 && isFinite(time)) {
                    this.eventQueue.add(new EdgeEvent(time, edge));
                }
            }
        }

        // Add initial split events
        for (const vertex of polygon.vertices) {
            if (vertex.isReflex()) {
                this.findSplitEvents(vertex);
            }
        }
    }

    private calculateEdgeCollapseTime(edge: Edge): number {
        // Get the angles between edge and bisectors
        const edgeDir = edge.direction();
        const theta1 = Angle.between(edgeDir, edge.v1.bisector);
        const theta2 = Angle.between(edgeDir, edge.v2.bisector);

        // Calculate collapse time: length / (1/sin(θ1) + 1/sin(θ2))
        const denominator = (1 / theta1.sin()) + (1 / theta2.sin());
        return edge.length() / denominator;
    }

    private findSplitEvents(vertex: Vertex): void {
        const polygon = this.wavefront.getCurrentPolygon();

        // Check each non-adjacent edge for potential splits
        for (const edge of polygon.edges) {
            if (!edge.isAdjacent(vertex)) {
                const intersection = this.calculateBisectorIntersection(vertex, edge);
                if (intersection) {
                    const time = this.calculateSplitTime(vertex, intersection);
                    if (time > 0 && isFinite(time)) {
                        this.eventQueue.add(new SplitEvent(time, vertex, edge, intersection));
                    }
                }
            }
        }
    }

    private calculateBisectorIntersection(vertex: Vertex, edge: Edge): Vector | null {
        // Get line equations
        const p1 = edge.v1.position;
        const p2 = edge.v2.position;
        const p3 = vertex.position;
        const p4 = vertex.position.plus(vertex.bisector);

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

    private calculateSplitTime(vertex: Vertex, intersection: Vector): number {
        // Time is distance from vertex to intersection divided by bisector velocity
        return vertex.position.minus(intersection).length();
    }

    compute(): void {
        while (!this.eventQueue.isEmpty()) {
            const event = this.eventQueue.poll();
            if (!event) continue;

            // Type guard to ensure event has process method
            if (event instanceof EdgeEvent || event instanceof SplitEvent) {
                event.process(this.wavefront);

                if (!this.wavefront.validateState()) {
                    throw new Error("Invalid wavefront state after event processing");
                }

                // Re-check for new events after processing
                this.updateEvents();
            } else {
                throw new Error("Unknown event type encountered");
            }
        }
    }

    private updateEvents(): void {
        this.eventQueue = new EventQueue(); // Clear existing events
        this.initializeEvents(); // Recalculate all events for current state
    }

    getWavefrontAtTime(time: number): Polygon {
        return this.wavefront.getPolygonAtTime(time);
    }

    getEdges(): Edge[] {
        return this.edges;
    }
}
