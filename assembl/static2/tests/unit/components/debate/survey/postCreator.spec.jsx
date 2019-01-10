// @flow
import React from 'react';
import renderer from 'react-test-renderer';

import PostCreator from '../../../../../js/app/components/debate/survey/postCreator';

describe('PostCreator component', () => {
  it('should display the name of the creator', () => {
    const props = {
      isPending: false,
      name: 'John Doe'
    };
    const component = renderer.create(<PostCreator {...props} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should not display the name of the creator if the post is awaiting moderation', () => {
    const props = {
      isPending: true,
      name: 'John Doe'
    };
    const component = renderer.create(<PostCreator {...props} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});