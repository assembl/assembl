import { MockedProvider } from 'react-apollo/test-utils';
import React from 'react';
import configureStore from 'redux-mock-store';
import renderer from 'react-test-renderer';

import PostsFilterMenu, { defaultOrderPolicy } from '../../../../../js/app/components/debate/common/postsFilterMenu';

describe('PostsFilterMenu component', () => {
  const mockStore = configureStore();
  const initialState = {
    threadFilter: {
      postsOrderPolicy: defaultOrderPolicy
    }
  };

  it('should render a filter with sort by recently started threads selected', () => {
    const props = {};
    const store = mockStore(initialState);
    const component = renderer.create(
      <MockedProvider store={store}>
        <PostsFilterMenu {...props} />
      </MockedProvider>
    );
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});