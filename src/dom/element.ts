import { Events as VueHtmlEvents, IntrinsicElementAttributes as VueHtmlAttributes } from "@vue/runtime-dom";

type VueEventAttributes = keyof VueHtmlEvents;
type HTMLEventName<V extends string> = V extends `on${infer R extends string}` ? Uncapitalize<R> : never;
export type SupportedHTMLElements = keyof HTMLElementTagNameMap & keyof VueHtmlAttributes;
export type SupportedHTMLRawAttributes = {
    [K in SupportedHTMLElements]: Omit<VueHtmlAttributes[K], VueEventAttributes>;
}
export type SupportedEventHandlerMap = {
    [K in VueEventAttributes as HTMLEventName<K>]: (event: VueHtmlEvents[K]) => void;
}
