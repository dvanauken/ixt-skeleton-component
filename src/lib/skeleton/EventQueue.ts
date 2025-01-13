
import { Event as CustomEvent } from "./Event";

export class EventQueue {
    private events: CustomEvent[] = [];
    
    add(event: CustomEvent): void {
        const index = this.events.findIndex(e => e.time > event.time);
        
        if (index === -1) {
            this.events.push(event);
        } else {
            this.events.splice(index, 0, event);
        }
    }
    
    poll(): CustomEvent | undefined {
        return this.events.shift();
    }
    
    peek(): CustomEvent | undefined {
        return this.events[0];
    }
    
    isEmpty(): boolean {
        return this.events.length === 0;
    }
    
    size(): number {
        return this.events.length;
    }
}