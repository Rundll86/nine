interface SubcriberCallback<T extends unknown[]> {
    (...data: T): void;
}
interface Subcriber<T extends unknown[]> {
    callback: SubcriberCallback<T>;
    once: boolean;
}
export class EventSubcriber<T extends unknown[]> {
    private subcribers: Subcriber<T>[] = [];
    private emitting: boolean = false;

    subcribe(callback: SubcriberCallback<T>, once = false) {
        this.subcribers.push({
            callback,
            once,
        });
    }
    emit(...data: T) {
        if (this.emitting) return;
        this.emitting = true;
        for (const subcriber of this.subcribers) {
            subcriber.callback(...data);
        }
        this.emitting = false;
    }
}