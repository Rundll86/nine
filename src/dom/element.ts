import { Events, IntrinsicElementAttributes } from "@vue/runtime-dom";

export type HTMLEventAttributes = keyof Events;
export type SupportedHTMLElements = keyof HTMLElementTagNameMap & keyof IntrinsicElementAttributes;
export type SupportedHTMLRawAttributes = {
    [K in SupportedHTMLElements]: Omit<IntrinsicElementAttributes[K], HTMLEventAttributes>;
}