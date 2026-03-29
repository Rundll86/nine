export interface SubcriberCallback<T extends unknown[]> {
    (...data: T): void;
}
export interface Subcriber<T extends unknown[]> {
    callback: SubcriberCallback<T>;
    once: boolean;
}
export class BaseSubcriber<T extends unknown[]> {
    protected subcribers: Subcriber<T>[] = [];

    subcribe(callback: SubcriberCallback<T>, once: boolean = false): void {
        this.subcribers.push({
            callback,
            once,
        });
    };
    emit(...data: T): void {
        for (const subcriber of this.subcribers) {
            subcriber.callback(...data);
        }
    }
}