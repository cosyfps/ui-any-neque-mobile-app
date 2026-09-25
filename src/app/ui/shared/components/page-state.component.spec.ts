import { TestBed } from '@angular/core/testing';

import { PageStateComponent } from './page-state.component';

describe('PageStateComponent', () => {
  it('arranca en loading con retry habilitado', () => {
    const cmp = new PageStateComponent();

    expect(cmp.type).toBe('loading');
    expect(cmp.title).toBe('');
    expect(cmp.message).toBe('');
    expect(cmp.showRetry).toBe(true);
  });

  it('onRetry() invoca el callback cuando existe', () => {
    const cmp = new PageStateComponent();
    const retry = jest.fn();
    cmp.retry = retry;

    cmp.onRetry();

    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('onRetry() no falla cuando no hay callback', () => {
    const cmp = new PageStateComponent();

    expect(() => cmp.onRetry()).not.toThrow();
  });

  it('se puede instanciar desde el TestBed', () => {
    TestBed.configureTestingModule({ imports: [PageStateComponent] });
    const fixture = TestBed.createComponent(PageStateComponent);

    expect(fixture.componentInstance).toBeInstanceOf(PageStateComponent);
  });
});
