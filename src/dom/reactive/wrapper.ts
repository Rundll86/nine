import { EventSubcriber } from "@/channel";
import { WRAPPER, attachFlag } from "@/constants/flags";
import watchers from "./watchers/implements";
import { StructWatcher, ValidateMethod } from "./watchers/base";
import { AccessError } from "@/exceptions";
import { Readable, Updatable, Writable } from "./structs/wrapper";

export type Wrapper<T> = Readable<T> & Writable<T> & Updatable<T>;

export function wrap<T>(initialState: T): Wrapper<T> {
    const event = new EventSubcriber<[T, T]>();

    const tryValidate = (use: ValidateMethod<unknown>, data: unknown) => {
        try {
            return use(data);
        } catch (e) {
            console.warn("Failed to validate data:", e);
        }
    };
    const patch = (target: T): {
        data: T
    } & {
        tryRevokeOld: (newState: T, oldState: T) => [T, T, boolean]
    } => {
        let currentWatcher: StructWatcher<T> | null = null;
        let oldRevoke: ((oldData: T) => void) | null = null;
        for (const watcher of Object.values(watchers).map(w => w.default)) {
            if (tryValidate(watcher.validate, initialState)) {
                currentWatcher = watcher as unknown as StructWatcher<T>;
                break;
            }
        }
        if (currentWatcher) {
            let currentState: T | null = null;
            const { data, revoke } = currentWatcher.patch(target, (data) => {
                if (!currentWatcher) return currentState!;
                currentState = currentWatcher.duplicate(data);
                return currentState;
            }, (newState) => {
                if (!currentState) throw new AccessError("StructWatcher updated a new data before snapshotting.");
                wrapper.event.emit(newState, currentState);
            }, wrapper);
            oldRevoke = revoke;
            return {
                data,
                tryRevokeOld: (newState, oldState) => {
                    if (tryValidate(currentWatcher.validate, oldState) && oldRevoke) {
                        oldState = currentWatcher.duplicate(oldState);
                        oldRevoke(oldState);
                        return [patch(newState).data, oldState, true];
                    } else {
                        const { data } = patch(newState);
                        return [data, oldState, true];
                    };
                }
            };
        } else {
            return {
                data: target,
                tryRevokeOld: (newState, oldState) => [newState, oldState, false],
            };
        }
    };

    const wrapper: Wrapper<T> = attachFlag({
        get() { return currentState; },
        set(newState) {
            if (currentState !== newState) {
                const [patchedNewState, patchedOldState] = tryRevokeOld(newState, currentState);
                currentState = patchedNewState;
                this.event.emit(patchedNewState, patchedOldState);
            }
        },
        updateOnly() {
            this.event.emit(this.get(), this.get());
        },
        event
    }, WRAPPER);
    const patcher = patch(initialState);
    let currentState = patcher.data;
    const tryRevokeOld = patcher.tryRevokeOld;
    return wrapper;
}