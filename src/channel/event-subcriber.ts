interface SubcriberCallback<T extends unknown[], R> {
    (...data: T): R;
}
interface Subcriber<T extends unknown[], R> {
    callback: SubcriberCallback<T, R>;
    once: boolean;
}
export class EventSubcriber<T extends unknown[], R = void> {
    private subcribers: Subcriber<T, R>[] = [];
    private emitting: boolean = false;

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
        this.emitting = false;
        return result;
    }
}