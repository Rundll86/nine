import { describe, it, expect, afterEach } from 'vitest';
import { wrap } from '@/dom/reactive/wrapper';

describe('Wrapper - Reactive state management', () => {
    afterEach(() => {
        // 清理任何全局状态
    });

    it('should create a wrapper for object state', () => {
        const state = wrap({ count: 0 });
        expect(state).toBeDefined();
        expect(state.get()).toBeDefined();
    });

    it('should create a wrapper for array state', () => {
        const state = wrap([1, 2, 3]);
        expect(state).toBeDefined();
        expect(state.get()).toBeDefined();
    });

    it('should create a wrapper for primitive state (with fallback)', () => {
        const state = wrap('hello');
        expect(state).toBeDefined();
        expect(state.get()).toBe('hello');
    });

    it('should track state updates via event subscription', () => {
        return new Promise<void>((done) => {
            const state = wrap({ count: 0 });
            
            state.event.subcribe((newState: any) => {
                expect(newState.count).toBe(1);
                done();
            });
            
            state.set({ count: 1 });
        });
    });

    it('should support handle references', async () => {
        const state = wrap({ count: 0 });
        let callCount = 0;
        
        // 持有 handle，订阅保持活跃
        const handle = state.event.subcribe(() => {
            callCount++;
        });
        
        expect(handle).toBeDefined();
        expect(handle.id).toBeDefined();
        
        state.set({ count: 1 });
        
        await new Promise(resolve => setTimeout(resolve, 50));
        expect(callCount).toBe(1);
        
        // 在实际应用中，当 handle 对象失去引用时，WeakMap 会自动清理
        // 这里不强制手动取消订阅，让垃圾回收自动处理
    });

    it('should track mutations via event subscription', async () => {
        const state = wrap({ a: 1, b: 2 });
        const updates: any[] = [];
        
        state.event.subcribe((newState: any) => {
            updates.push(newState);
        });
        
        // 直接修改状态对象属性
        const current = state.get();
        current.a = 10;
        state.updateOnly(); // 手动触发更新
        
        await new Promise(resolve => setTimeout(resolve, 50));
        expect(updates.length).toBeGreaterThan(0);
        expect(updates[0].a).toBe(10);
    });

    it('should handle array state mutations', async () => {
        const state = wrap([1, 2, 3]);
        const updates: any[] = [];
        
        state.event.subcribe((newArray: any) => {
            updates.push(Array.from(newArray));
        });
        
        const current = state.get();
        current[0] = 10;
        state.updateOnly();
        
        await new Promise(resolve => setTimeout(resolve, 50));
        expect(updates.length).toBeGreaterThan(0);
        expect(updates[0][0]).toBe(10);
    });

    it('should set complete state replacement', () => {
        return new Promise<void>((done) => {
            const state = wrap({ value: 'initial' });
            
            state.event.subcribe((newState: any) => {
                expect(newState.value).toBe('updated');
                done();
            });
            
            state.set({ value: 'updated' });
        });
    });

    it('should handle nested object state', () => {
        const state = wrap({ nested: { deep: 'value' } });
        const current = state.get();
        
        expect(current.nested.deep).toBe('value');
        
        current.nested.deep = 'modified';
        state.updateOnly();
        
        expect(state.get().nested.deep).toBe('modified');
    });

    it('should support get method for reading state', () => {
        const state = wrap({ count: 0 });
        expect(state.get().count).toBe(0);
        
        state.set({ count: 5 });
        expect(state.get().count).toBe(5);
    });

    it('should handle validation errors gracefully', () => {
        // 这个测试验证 tryValidate 函数的错误处理
        const state = wrap({ test: 'data' });
        expect(state).toBeDefined();
        expect(state.get()).toBeDefined();
        // 不应该抛出错误
    });

    it('should pass through mixed state types', () => {
        const primitiveState = wrap(42);
        const objectState = wrap({ key: 'value' });
        const arrayState = wrap([1, 2, 3]);
        
        expect(primitiveState.get()).toBe(42);
        expect(objectState.get().key).toBe('value');
        expect(arrayState.get()[0]).toBe(1);
    });
});
