import { WRAPPER, matchFlag } from "@/constants/flags";
import { wrap, Wrapper } from "..";

export function sync<R>(effectRenderer: () => R, dependencies: unknown[] = []): Wrapper<R> {
    const internalWrapper = wrap(effectRenderer());
    const update = () => {
        const newData = effectRenderer();
        const currentData = internalWrapper.get();
        const hasChanged = currentData !== newData;
        if (hasChanged) {
            internalWrapper.set(newData);
        }
    };
    for (const dependency of dependencies) {
        if (!matchFlag(dependency, WRAPPER)) continue;
        dependency.event.subcribe(update);
    }
    return internalWrapper;
}