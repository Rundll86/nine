import { ComponentPropertyStore } from ".";
import { AccessError, ConflictionError, MissingError, ValidationFailed } from "@/exceptions";
import { matchFlag, WRAPPER } from "@/constants/flags";
import { wrap, Wrapper } from "../reactive";
import { EmptyValue } from "@/util";

export interface PropertyTransformer<I, O> {
    (data: I): O;
}
export interface PropertyDescriptor<I = unknown, O = unknown, R extends boolean = boolean> {
    validate?: (data: I) => boolean;
    transform: PropertyTransformer<I, O>;
    shadow?: O;
    required?: R;
    downloadable?: boolean;
    uploadable?: boolean;
}
export type PropertyInputDict<P extends ComponentPropertyStore> = {
    [K in keyof P as P[K]["required"] extends true ? K : never]:
    P[K] extends PropertyDescriptor<unknown, infer R>
    ? R | Wrapper<R> : never;
} & {
    [K in keyof P as P[K]["required"] extends false | unknown ? K : never]?:
    P[K] extends PropertyDescriptor<unknown, infer R>
    ? R | Wrapper<R> | EmptyValue : never;
}
export type PropertyOutputDict<P extends ComponentPropertyStore> = {
    [K in keyof P]:
    P[K] extends PropertyDescriptor<unknown, infer R>
    ? Wrapper<R> : never;
};

export function typed<T>(): PropertyTransformer<unknown, T> {
    return (x) => x as T;
}
export function normalizePropertyDescriptor
    <I, O, R extends boolean>(
        descriptor: PropertyDescriptor<I, O, R>
    ): Required<PropertyDescriptor<I, O, R>> {
    return Object.assign({
        validate: () => true,
        transform: x => x,
        shadow: null,
        required: false,
        downloadable: true,
        uploadable: false
    } satisfies Required<PropertyDescriptor>, descriptor);
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
export function hostdown<T extends ComponentPropertyStore>(upstream?: PropertyInputDict<T>, store?: T) {
    if (!upstream) upstream = {} as PropertyInputDict<T>;
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
                throw new MissingError(`Missing a required property ${propertyKey}.`);
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
    return downstream as PropertyOutputDict<T>;
}