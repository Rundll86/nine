import { BaseSubcriber } from "./baseSubcriber";

export class EventSubcriber<T extends unknown[]> extends BaseSubcriber<T> {
    public parent?: BaseSubcriber<T>;
    public bubbleable: boolean;
    private emitting: boolean = false;

    constructor(config?: {
        bubbleable?: boolean;
    }, parent?: BaseSubcriber<T>) {
        super();
        this.parent = parent;
        this.bubbleable = config?.bubbleable ?? false;
    }
    emit(...data: T): void {
        if (this.emitting) return;
        this.emitting = true;
        super.emit(...data);
        if (this.parent) {
            this.parent.emit(...data);
        }
        this.emitting = false;
    }
}