import { ComponentSlotStore, SourceTree } from ".";
import { normalizeWrap, Wrapper } from "../reactive";
import { MissingError } from "@/exceptions";

export type SlotDescriptor<T = unknown, N extends string = string, R extends boolean = boolean> = {
    name: N;
} & SlotOptions<T, R>;
export interface SlotOptions<T, R extends boolean> {
    template: T;
    required?: R;
    defaultValue?: SourceTree;
}
export type SlotInput<T> = (data: Wrapper<T>) => SourceTree | Wrapper<SourceTree>;
export type SlotOutput<T> = (data: T | Wrapper<T>) => Wrapper<SourceTree>;
export type SlotInputDict<T extends ComponentSlotStore> = {
    [K in T[number]as K["name"]]?: SlotInput<K["template"]>;
};
export type SlotOutputDict<T extends ComponentSlotStore> = {
    [K in T[number]as K["name"]]-?: SlotOutput<K["template"]>;
}

export function normalizeRenderer<T>(render: SlotInput<T>): SlotOutput<T> {
    return (data: T | Wrapper<T>) => normalizeWrap(render(normalizeWrap(data)));
}
export function renderSlots<T extends ComponentSlotStore>(rawInput?: SlotInputDict<T>, store?: T): SlotOutputDict<T> {
    if (!store) return {} as SlotOutputDict<T>;
    const input = rawInput as Record<string, SlotInput<T[number]["template"]>>;
    return Object.fromEntries(store.map(descriptor => {
        if (descriptor.required && (!input || !Object.hasOwn(input, descriptor.name))) {
            throw new MissingError(`Missing a required slot ${descriptor.name}.`);
        }
        if (!input || !input[descriptor.name]) return [descriptor.name, () => null];
        return [
            descriptor.name,
            normalizeRenderer(input[descriptor.name])
        ];
    })) as SlotOutputDict<T>;
}
export function defineSlot<N extends string, R extends boolean, T>(name: N, options: SlotOptions<T, R>) {
    return {
        name,
        ...options
    };
}