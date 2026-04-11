export interface SubcriberCallback<T extends unknown[], R> {
    (...data: T): R;
}
export interface Subcriber<T extends unknown[], R> {
    callback: SubcriberCallback<T, R>;
    once: boolean;
}
export class BaseSubcriber<T extends unknown[], R = void> {
    protected subcribers: Subcriber<T, R>[] = [];

    subcribe(callback: SubcriberCallback<T, R>, once: boolean = false): void {
        this.subcribers.push({
            callback,
            once,
        });
    };
    emit(...data: T): R[] {
        return this.subcribers.map(subcriber => subcriber.callback(...data));
    }
}