import { renderHook, act } from '@testing-library/react';
import { jest } from '@jest/globals';

jest.unstable_mockModule('framer-motion', () => ({
  animate: (from, to, { onUpdate, onComplete }) => {
    if (onUpdate) onUpdate(1);
    if (onComplete) onComplete();
  },
}));

const { useElementHighlight } = await import('../useElementHighlight.js');

jest.useFakeTimers();

describe('useElementHighlight', () => {
  test('adds and removes highlight classes', () => {
    document.body.innerHTML = '<div id="test"></div>';
    const el = document.getElementById('test');
    el.scrollIntoView = jest.fn();

    const { result } = renderHook(() => useElementHighlight(1000));
    act(() => {
      result.current.highlight('#test');
    });
    expect(el.classList.contains('bg-yellow-200')).toBe(true);
    expect(el.classList.contains('ring-yellow-400')).toBe(true);
    expect(el.scrollIntoView).toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(el.classList.contains('bg-yellow-200')).toBe(false);
    expect(el.classList.contains('ring-yellow-400')).toBe(false);
  });
});
