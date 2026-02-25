interface SubcriberCallback<T extends unknown[]> {
    (...data: T): void;
}
interface Subcriber<T extends unknown[]> {
    callback: SubcriberCallback<T>;
    once: boolean;
}
export class EventSubcriber<T extends unknown[]> {
    private subcribers: Subcriber<T>[] = [];

    subcribe(callback: SubcriberCallback<T>, once = false) {
        this.subcribers.push({
            callback,
            once,
        });
    }
    async once() {
        return new Promise<{ data: T }>((resolve) => {
            this.subcribe((...data) => resolve({ data }), true);
        });
    }
    emit(...data: T) {
        for (const subcriber of this.subcribers) {
            subcriber.callback(...data);
        }
    }
}