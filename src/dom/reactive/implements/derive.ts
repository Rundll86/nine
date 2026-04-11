import { toWrapper } from "../utils";
import { wrap, Wrapper } from "../wrapper";

export function derive<I, E>(initialOrSource: I | Wrapper<I>, get: (internal: I) => E, set: (external: E) => I): Wrapper<E> {
    const internalWrapper = toWrapper(initialOrSource);
    const internalSet = internalWrapper.set;
    const internalGet = internalWrapper.get;
    const externalWrapper = wrap<E>(null as E);
    const externalSet = externalWrapper.set;
    externalWrapper.set = (newState) => {
        internalSet(set(newState));
        externalSet(newState);
    };
    externalWrapper.get = () => get(internalGet());
    return externalWrapper;
}
