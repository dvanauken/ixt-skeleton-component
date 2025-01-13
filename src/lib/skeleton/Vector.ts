export class Vector {
    constructor(public x: number, public y: number) {}

    plus(other: Vector): Vector {
        return new Vector(
            this.x + other.x,
            this.y + other.y
        );
    }

    minus(other: Vector): Vector {
        return new Vector(
            this.x - other.x,
            this.y - other.y
        );
    }

    normalize(): Vector {
        const len = this.length();
        if (len === 0) {
            throw new Error("Cannot normalize zero vector");
        }
        return new Vector(
            this.x / len,
            this.y / len
        );
    }

    length(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    scale(factor: number): Vector {
        return new Vector(
            this.x * factor,
            this.y * factor
        );
    }

    dot(other: Vector): number {
        return this.x * other.x + this.y * other.y;
    }

    cross(other: Vector): number {
        // For 2D vectors, cross product is the z-component only
        return this.x * other.y - this.y * other.x;
    }

    clone(): Vector {
        return new Vector(this.x, this.y);
    }

    static bisector(angle1: number, angle2: number): number {
        const toRadians = Math.PI / 180;
        const v1 = {
            x: Math.cos(angle1 * toRadians),
            y: Math.sin(angle1 * toRadians),
        };
        const v2 = {
            x: Math.cos(angle2 * toRadians),
            y: Math.sin(angle2 * toRadians),
        };
        const sumX = v1.x + v2.x;
        const sumY = v1.y + v2.y;
        const magnitude = Math.sqrt(sumX * sumX + sumY * sumY);
        const bisectorVectorX = sumX / magnitude;
        const bisectorVectorY = sumY / magnitude;
        let bisectorAngleRadians = Math.atan2(bisectorVectorY, bisectorVectorX);
        let bisectorAngleDegrees = bisectorAngleRadians * (180 / Math.PI);
        
        // Normalize angle to 0-360 degrees
        if (bisectorAngleDegrees < 0) {
            bisectorAngleDegrees += 360;
        }
        
        return bisectorAngleDegrees;
    }
}
