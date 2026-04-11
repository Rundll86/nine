import { Wrapper } from "../wrapper";

export interface BridgeOption {
    uploadable: boolean;
    downloadable: boolean;
}
export function bridge<T>(upstream: Wrapper<T>, downstream: Wrapper<T>, options: BridgeOption) {
    upstream.event.subcribe((newState) => {
        if (!options.downloadable) return;
        if (newState === downstream.get()) return;
        downstream.set(newState);
    });
    downstream.event.subcribe((newState) => {
        if (!options.uploadable) return;
        if (newState === upstream.get()) return;
        upstream.set(newState);
    });
}