import { describe, it, expect } from 'vitest';
import { duplicateObject } from '@/util/clone';

describe('duplicateObject - Clone utility', () => {
    it('should return primitive values unchanged', () => {
        expect(duplicateObject(1)).toBe(1);
        expect(duplicateObject('string')).toBe('string');
        expect(duplicateObject(true)).toBe(true);
        expect(duplicateObject(null)).toBe(null);
        expect(duplicateObject(undefined)).toBe(undefined);
    });

    it('should deep clone objects', () => {
        const original = { a: 1, b: { c: 2 } };
        const cloned = duplicateObject(original);
        
        expect(cloned).toEqual(original);
        expect(cloned).not.toBe(original);
        expect(cloned.b).not.toBe(original.b);
    });

    it('should deep clone arrays', () => {
        const original = [1, 2, [3, 4]];
        const cloned = duplicateObject(original);
        
        expect(cloned).toEqual(original);
        expect(cloned).not.toBe(original);
        expect(cloned[2]).not.toBe(original[2]);
    });

    it('should handle Date objects', () => {
        const original = new Date('2024-01-01');
        const cloned = duplicateObject(original);
        
        expect(cloned).toEqual(original);
        expect(cloned).not.toBe(original);
        expect(cloned instanceof Date).toBe(true);
    });

    it('should handle RegExp objects', () => {
        const original = /test/gi;
        const cloned = duplicateObject(original);
        
        expect(cloned.source).toBe(original.source);
        expect(cloned.flags).toBe(original.flags);
        // RegExp 的 lastIndex 可能不同，但基本功能应该相同
    });

    it('should handle Map objects', () => {
        const original = new Map([
            ['key1', 'value1'],
            ['key2', { nested: 'value' }],
        ]);
        const cloned = duplicateObject(original);
        
        expect(cloned).toEqual(original);
        expect(cloned).not.toBe(original);
        expect(cloned.get('key2')).not.toBe(original.get('key2'));
    });

    it('should handle Set objects', () => {
        const original = new Set([1, 2, { nested: 'value' }]);
        const cloned = duplicateObject(original);
        
        expect(cloned.size).toBe(original.size);
        expect(cloned).not.toBe(original);
    });

    it('should prevent stack overflow with depth limit', () => {
        // 创建一个深度超过限制的对象
        let obj: any = { value: 'bottom' };
        for (let i = 0; i < 150; i++) {
            obj = { nested: obj };
        }
        
        // 应该不会抛出错误，而是返回引用
        expect(() => {
            duplicateObject(obj);
        }).not.toThrow();
    });

    it('should respect duplicator predicate', () => {
        const original = { a: 1, b: { c: 2 } };
        const duplicator = (data: unknown) => {
            // 只克隆对象，跳过原始值
            return data && typeof data === 'object';
        };
        
        const cloned = duplicateObject(original, duplicator);
        expect(cloned).toEqual(original);
    });

    it('should handle circular references', () => {
        const original: any = { a: 1 };
        original.self = original;
        
        const cloned = duplicateObject(original);
        expect(cloned.a).toBe(1);
        expect(cloned.self).toBe(cloned); // 应该指向克隆后的对象
    });

    it('should handle complex nested structures', () => {
        const original = {
            array: [1, 2, 3],
            object: { nested: { deep: 'value' } },
            map: new Map([['key', [1, 2, 3]]]),
            set: new Set([1, 2, 3]),
            date: new Date('2024-01-01'),
        };
        
        const cloned = duplicateObject(original);
        
        expect(cloned).toEqual(original);
        expect(cloned.array).not.toBe(original.array);
        expect(cloned.object).not.toBe(original.object);
        expect(cloned.map).not.toBe(original.map);
        expect(cloned.set).not.toBe(original.set);
        expect(cloned.date).not.toBe(original.date);
    });
});
