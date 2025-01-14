import { Vector } from "./Vector";

export class Angle {
    private radians: number;

    private constructor(radians: number) {
        this.radians = radians;
    }

    static between(v1: Vector, v2: Vector): Angle {
        // Use atan2 for correct quadrant handling
        return new Angle(Math.atan2(
            v1.x * v2.y - v1.y * v2.x,  // Cross product for 2D
            v1.x * v2.x + v1.y * v2.y   // Dot product
        ));
    }

    static fromDegrees(deg: number): Angle {
        // Convert to radians and normalize
        return new Angle((deg * Math.PI / 180) % (2 * Math.PI));
    }

    static fromVector(v: Vector): Angle {
        // Use atan2 for correct quadrant handling relative to x-axis
        return new Angle(Math.atan2(v.y, v.x));
    }

    static fromRadians(rad: number): Angle {
        // Normalize to [-π, π]
        return new Angle(rad % (2 * Math.PI));
    }

    sin(): number {
        return Math.sin(this.radians);
    }

    cos(): number {
        return Math.cos(this.radians);
    }

    tan(): number {
        return Math.tan(this.radians);
    }

    toDegrees(): number {
        return this.radians * 180 / Math.PI;
    }

    toRadians(): number {
        return this.radians;
    }
}