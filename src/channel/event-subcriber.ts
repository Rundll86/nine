interface SubcriberCallback<T extends unknown[], R> {
    (...data: T): R;
}
interface Subcriber<T extends unknown[], R> {
    callback: SubcriberCallback<T, R>;
    once: boolean;
}
export class EventSubcriber<T extends unknown[], R = void> {
    public parent?: EventSubcriber<T, R>;
    public bubbleable: boolean;
    private subcribers: Subcriber<T, R>[] = [];
    private emitting: boolean = false;

    constructor(config?: {
        bubbleable?: boolean;
    }, parent?: EventSubcriber<T, R>) {
        this.parent = parent;
        this.bubbleable = config?.bubbleable ?? false;
    }
    subcribe(callback: SubcriberCallback<T, R>, once = false) {
        this.subcribers.push({
            callback,
            once,
        });
    }
    emit(...data: T): R[] | void {
        if (this.emitting) return;
        this.emitting = true;
        const result: R[] = [];
        for (const subcriber of this.subcribers) {
            result.push(subcriber.callback(...data));
        }
        if (this.bubbleable && this.parent) {
            this.parent.emit(...data);
        }
        this.emitting = false;
        return result;
    }
}