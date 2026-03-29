import { BaseSubcriber } from "./baseSubcriber";

export class EventSubcriber<T extends unknown[], R = void> extends BaseSubcriber<T, R> {
    public parent?: BaseSubcriber<T, R>;
    public bubbleable: boolean;
    private emitting: boolean = false;

    constructor(config?: {
        bubbleable?: boolean;
    }, parent?: BaseSubcriber<T, R>) {
        super();
        this.parent = parent;
        this.bubbleable = config?.bubbleable ?? false;
    }
    emit(...data: T): R[] {
        if (this.emitting) return [];
        this.emitting = true;
        const result = super.emit(...data);
        if (this.parent) {
            this.parent.emit(...data);
        }
        this.emitting = false;
        return result;
    }
}