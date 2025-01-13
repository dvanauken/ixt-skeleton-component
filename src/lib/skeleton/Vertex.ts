import { Angle } from "./Angle";
import { Vector } from "./Vector";

export class Vertex {
    position: Vector;
    prev: Vertex | null;
    next: Vertex | null;
    bisector: Vector;

    constructor(position: Vector) {
        this.position = position;
        this.prev = null;
        this.next = null;
        this.bisector = new Vector(0, 0); // Will be calculated when prev/next are set
    }

    isReflex(): boolean {
        if (!this.prev || !this.next) {
            throw new Error("Vertex is not properly linked");
        }

        // Get vectors pointing from this vertex to prev and next
        const toPrev = new Vector(
            this.prev.position.x - this.position.x,
            this.prev.position.y - this.position.y
        );

        const toNext = new Vector(
            this.next.position.x - this.position.x,
            this.next.position.y - this.position.y
        );

        // Cross product positive means angle is > 180 degrees (reflex)
        return toPrev.cross(toNext) < 0;
    }

    getAngle(): Angle {
        if (!this.prev || !this.next) {
            throw new Error("Vertex is not properly linked");
        }

        // Get vectors pointing AWAY from this vertex
        const prevVector = new Vector(
            this.position.x - this.prev.position.x,
            this.position.y - this.prev.position.y
        );

        const nextVector = new Vector(
            this.next.position.x - this.position.x,
            this.next.position.y - this.position.y
        );

        return Angle.between(prevVector, nextVector);
    }

    clone(): Vertex {
        const vertex = new Vertex(this.position.clone());
        vertex.bisector = this.bisector.clone();
        // Note: prev and next references need to be set after cloning
        return vertex;
    }
}