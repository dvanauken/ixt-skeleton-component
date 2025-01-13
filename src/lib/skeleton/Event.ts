import { Wavefront } from "./Wavefront";

export abstract class Event {
    public readonly time: number;

    constructor(time: number) {
        if (time < 0) {
            throw new Error("Event time cannot be negative");
        }
        if (!isFinite(time)) {
            throw new Error("Event time must be finite");
        }
        this.time = time;
    }
    
    abstract process(wavefront: Wavefront): void;

    public compareTo(event: Event): number {
        return this.time - event.time;
    }
}