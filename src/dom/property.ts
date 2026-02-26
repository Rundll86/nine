import { ComponentPropertyDescriptor, ComponentPropertyInputDict, ComponentPropertyOutputDict, ComponentPropertyStore } from "./component";
import { AccessError, ConflictionError, MissingFieldError, ValidationFailed } from "@/exceptions";
import { matchFlag, WRAPPER } from "@/constants/flags";
import { wrap } from "./reactive";

export function rawProperty<T>(): (x: unknown) => T {
    return (x: unknown) => x as T;
}
export function normalizePropertyDescriptor
    <I, O, R extends boolean>(
    descriptor: ComponentPropertyDescriptor<I, O, R>
): Required<ComponentPropertyDescriptor<I, O, R>> {
    return Object.assign({
        validate: () => true,
        transform: x => x,
        shadow: null,
        required: false,
        downloadable: true,
        uploadable: false
    } satisfies Required<ComponentPropertyDescriptor>, descriptor);
}
export function validateStore(store: ComponentPropertyStore) {
    for (const propertyKey in store) {
        const descriptor = store[propertyKey];
        if (descriptor.shadow) {
            if (descriptor.required) {
                throw new ConflictionError(`The required property ${propertyKey} can't have a shadow.`);
            }
            if (descriptor.validate && !descriptor.validate(descriptor.shadow)) {
                throw new ValidationFailed(`The shadow of ${propertyKey} can't pass the validation.`);
            }
        }
    }
}
export function hostdown<T extends ComponentPropertyStore>(upstream?: ComponentPropertyInputDict<T>, store?: T) {
    if (!upstream) upstream = {} as ComponentPropertyInputDict<T>;
    const downstream: Record<string, unknown> = {};
    for (const propertyKey in store) {
        const descriptor = normalizePropertyDescriptor(store[propertyKey]);
        const setValue = (newValue: unknown) => {
            if (matchFlag(downstream[propertyKey], WRAPPER)) {
                downstream[propertyKey].set(newValue);
            } else {
                const wrapper = wrap(newValue);
                downstream[propertyKey] = wrapper;
                wrapper.event.subcribe((newData) => {
                    if (!matchFlag(upstream[propertyKey], WRAPPER) || !matchFlag(downstream[propertyKey], WRAPPER)) return;
                    if (downstream[propertyKey].get() === upstream[propertyKey].get()) return;
                    if (!descriptor.uploadable) throw new AccessError(`Property ${propertyKey} isn't uploadable but being set.`);
                    upstream[propertyKey].set(newData);
                });
            }
        };
        const update = (inputValue: unknown, firstSet: boolean) => {
            if (!firstSet && !descriptor.downloadable) {
                console.warn(`Property ${propertyKey} isn't downloadable but being emitted.`);
                return;
            }
            if (!descriptor.validate(inputValue)) {
                throw new ValidationFailed(`The input value of ${propertyKey} can't pass the validation.`);
            }
            setValue(descriptor.transform(inputValue));
        };
        if (!Object.hasOwn(upstream, propertyKey)) {
            if (descriptor.required) {
                throw new MissingFieldError(`Missing a required property ${propertyKey}.`);
            }
            setValue(descriptor.shadow);
            continue;
        }
        if (matchFlag(upstream[propertyKey], WRAPPER)) {
            upstream[propertyKey].event.subcribe(e => update(e, false));
            update(upstream[propertyKey].get(), true);
        } else {
            update(upstream[propertyKey], true);
        }
    }
    return downstream as ComponentPropertyOutputDict<T>;
}