// @flow
import createStore from '../createStore';

describe('createStore', () => {
  it('should create a store that handles state and listeners', () => {
    const store = createStore({
      content: 'my content'
    });
    expect(store.getItem('content')).toEqual('my content');
    const myContentListener = jest.fn();
    const myOtherContentListener = jest.fn();
    store.subscribeToItem('content', myContentListener);
    store.subscribeToItem('content', myOtherContentListener);
    store.updateItem('content', 'foo');
    expect(store.getItem('content')).toEqual('foo');
    expect(myContentListener).toBeCalledWith('foo');
    expect(myOtherContentListener).toBeCalledWith('foo');
    store.unsubscribeFromItem('content', myContentListener);
    store.updateItem('content', 'bar');
    expect(store.getItem('content')).toEqual('bar');
    expect(myContentListener).not.toBeCalledWith('bar');
    expect(myOtherContentListener).toBeCalledWith('bar');
  });
});