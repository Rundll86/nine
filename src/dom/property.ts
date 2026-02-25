import { ComponentPropertyDescriptor } from "./component";

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