import { ComponentPropertyDescriptor, ComponentPropertyInputDict, ComponentPropertyOutputDict, ComponentPropertyStore } from "./component";
import { AccessError, ConflictionError, MissingFieldError, ValidationFailed } from "@/exceptions";
import { isWrapper, wrap } from "./reactive";
import { Valueof } from "@/util";

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
export function composeDict<T extends ComponentPropertyStore>(input?: ComponentPropertyInputDict<T>, store?: T) {
    if (!input) input = {} as ComponentPropertyInputDict<T>;
    const result: Record<string, unknown> = {};
    for (const propertyKey in store) {
        const descriptor = normalizePropertyDescriptor(store[propertyKey]);
        const setValue = (newValue: unknown) => {
            if (isWrapper(result[propertyKey])) {
                result[propertyKey].set(newValue);
            } else {
                const wrapper = wrap(newValue);
                result[propertyKey] = wrapper;
                wrapper.event.subcribe((newData) => {
                    if (!descriptor.uploadable) throw new AccessError(`Property ${propertyKey} isn't uploadable but being set.`);
                    if (!isWrapper(input[propertyKey])) return;
                    input[propertyKey].set(newData);
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
        if (!Object.hasOwn(input, propertyKey)) {
            if (descriptor.required) {
                throw new MissingFieldError(`Missing a required property ${propertyKey}.`);
            }
            setValue(descriptor.shadow);
            continue;
        }
        if (isWrapper(input[propertyKey])) {
            input[propertyKey].event.subcribe(e => update(e, false));
            update(input[propertyKey].get(), true);
        } else {
            update(input[propertyKey], true);
        }
    }
    console.log(result);
    return result as ComponentPropertyOutputDict<T>;
}