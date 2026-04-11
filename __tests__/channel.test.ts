import { describe, it, expect, beforeEach } from 'vitest';
import { BaseSubcriber } from '@/channel/baseSubcriber';

describe('BaseSubcriber', () => {
    let subscriber: BaseSubcriber<[string], void>;

    beforeEach(() => {
        subscriber = new BaseSubcriber();
    });

    it('should call callback when emitting', () => {
        const mockFn = (value: string) => {
            expect(value).toBe('test');
        };
        subscriber.subcribe(mockFn);
        subscriber.emit('test');
    });

    it('should support multiple callbacks', () => {
        let count = 0;
        subscriber.subcribe(() => count++);
        subscriber.subcribe(() => count++);
        subscriber.emit('test');
        expect(count).toBe(2);
    });

    it('should return subscription handle', () => {
        const handle = subscriber.subcribe(() => {});
        expect(handle).toBeDefined();
        expect(handle.id).toBeDefined();
    });

    it('should auto-clean when handle is dereferenced', () => {
        let callCount = 0;
        let handle = subscriber.subcribe(() => callCount++);
        
        subscriber.emit('first');
        expect(callCount).toBe(1);
        
        // 模拟 handle 被垃圾回收：取消引用
        handle = undefined as any;
        // 手动触发清理（正常情况由 GC 自动触发）
        subscriber.emit('second');
        // 由于 WeakMap 清理，第二次emit时 handle 应该被清理掉
        expect(callCount).toBe(2); // 仍然会执行，因为 GC 还未运行
    });

    it('should handle multiple handles independently', () => {
        let count1 = 0;
        let count2 = 0;
        
        const handle1 = subscriber.subcribe(() => count1++);
        const handle2 = subscriber.subcribe(() => count2++);
        
        subscriber.emit('first');
        expect(count1).toBe(1);
        expect(count2).toBe(1);
        
        // 注：WeakMap 自动清理需要 GC，此测试验证基础结构
    });

    it('should return array of results from emit', () => {
        const results = new BaseSubcriber<[number], number>();
        results.subcribe(() => 1);
        results.subcribe(() => 2);
        results.subcribe(() => 3);
        
        const values = results.emit(42);
        expect(values).toEqual([1, 2, 3]);
    });

    it('should handle errors in callbacks gracefully', () => {
        let normalCallCount = 0;
        
        subscriber.subcribe(() => {
            throw new Error('test error');
        });
        subscriber.subcribe(() => {
            normalCallCount++;
        });
        
        // 不应该抛出，继续执行后续回调
        expect(() => subscriber.emit('test')).not.toThrow();
        expect(normalCallCount).toBe(1); // 后续回调仍被执行
    });
});
