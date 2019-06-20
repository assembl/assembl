import { configure, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16'; // eslint-disable-line
import React from 'react';
import renderer from 'react-test-renderer';

import Modal from '../Modal';

configure({ adapter: new Adapter() });

describe('Modal component', () => {
  let state;
  let jsx;
  let store;

  beforeEach(() => {
    state = {
      content: {
        title: 'Modal title',
        body: <div>My modal body</div>
      }
    };
    store = {
      subscribeToItem: jest.fn(),
      unsubscribeFromItem: jest.fn(),
      getItem: name => state[name]
    };
    const props = {
      close: jest.fn(),
      store: store
    };
    jsx = <Modal {...props} />;
  });

  it('should subscribe/unsubscribe to content', () => {
    const wrapper = mount(jsx);
    expect(store.subscribeToItem).toHaveBeenCalledWith('content', expect.any(Function));
    wrapper.unmount();
    expect(store.unsubscribeFromItem).toHaveBeenCalledWith('content', expect.any(Function));
  });

  it('should render a form to add a link', () => {
    const component = renderer.create(jsx);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});