import { Events as VueHtmlEvents, IntrinsicElementAttributes as VueHtmlAttributes } from "@vue/runtime-dom";

export type HTMLEventAttributes = keyof VueHtmlEvents;
export type SupportedHTMLElements = keyof HTMLElementTagNameMap & keyof VueHtmlAttributes;
export type SupportedHTMLRawAttributes = {
    [K in SupportedHTMLElements]: Omit<VueHtmlAttributes[K], HTMLEventAttributes>;
}