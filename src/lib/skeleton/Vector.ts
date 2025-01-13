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
}