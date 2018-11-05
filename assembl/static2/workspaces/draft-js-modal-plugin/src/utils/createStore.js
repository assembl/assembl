// @flow
function createStore(initialState: { [string]: any }) {
  let state = initialState || {};
  const listeners = {};

  const subscribeToItem = (key: string, callback: Function) => {
    listeners[key] = listeners[key] || [];
    listeners[key].push(callback);
  };

  const unsubscribeFromItem = (key: string, callback: Function) => {
    listeners[key] = listeners[key].filter(listener => listener !== callback);
  };

  const updateItem = (key: string, item: any) => {
    state = {
      ...state,
      [key]: item
    };
    if (listeners[key]) {
      listeners[key].forEach(listener => listener(state[key]));
    }
  };

  const getItem = (key: string): any => state[key];

  return {
    subscribeToItem: subscribeToItem,
    unsubscribeFromItem: unsubscribeFromItem,
    updateItem: updateItem,
    getItem: getItem
  };
}

export default createStore;