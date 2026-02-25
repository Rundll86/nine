import { Normalize } from "@/util";
import { ComponentPropertyDescriptor, ComponentPropertyInputDict, ComponentPropertyOutputDict, ComponentPropertyStore } from "./component";
import { ConflictionError, MissingFieldError, ValidationFailed } from "@/exceptions";

export function normalizePropertyDescriptor
    <I, O, R extends boolean>(
        descriptor: ComponentPropertyDescriptor<I, O, R>
    ): Required<ComponentPropertyDescriptor<I, O, R>> {
    return Object.assign({
        validate: () => true,
        transform: x => x,
        shadow: null,
        required: false
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
        if (!Object.hasOwn(input, propertyKey)) {
            if (descriptor.required) {
                throw new MissingFieldError(`Missing a required property ${propertyKey}.`);
            }
            result[propertyKey] = descriptor.shadow;
            continue;
        }
        const value = input[propertyKey];
        if (!descriptor.validate(value)) {
            throw new ValidationFailed(`The input value of ${propertyKey} can't pass the validation.`);
        }
        result[propertyKey] = descriptor.transform(value);
    }
    return result as ComponentPropertyOutputDict<T>;
}