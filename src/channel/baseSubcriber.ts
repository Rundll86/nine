export interface SubcriberCallback<T extends unknown[], R> {
    (...data: T): R;
}

/**
 * 订阅句柄：用户持有此对象，当句柄被垃圾回收时，
 * WeakMap 会自动清理关联的回调，无需手动取消订阅
 */
export interface SubscriptionHandle {
    readonly id: symbol;
}

export class BaseSubcriber<T extends unknown[], R = void> {
    // 使用 WeakMap 存储回调，当 handle 被 GC 时自动清理
    private callbacks = new WeakMap<SubscriptionHandle, SubcriberCallback<T, R>>();
    private once = new WeakMap<SubscriptionHandle, boolean>();
    private handles: SubscriptionHandle[] = [];

    /**
     * 订阅一个事件
     * @returns 订阅句柄，当此对象被垃圾回收时，订阅自动移除
     */
    subcribe(callback: SubcriberCallback<T, R>, once: boolean = false): SubscriptionHandle {
        const handle: SubscriptionHandle = { id: Symbol('subscription') };
        this.callbacks.set(handle, callback);
        this.once.set(handle, once);
        this.handles.push(handle);
        return handle;
    }

    emit(...data: T): R[] {
        const results: R[] = [];
        
        // 清理已被垃圾回收的 handle
        this.handles = this.handles.filter(handle => {
            const callback = this.callbacks.get(handle);
            if (!callback) {
                // handle 已被 GC，WeakMap 自动清理
                return false;
            }
            
            try {
                results.push(callback(...data));
            } catch (e) {
                console.error('[nine] Error in subscriber callback:', e);
            }
            
            return true;
        });
        
        return results;
    }
}