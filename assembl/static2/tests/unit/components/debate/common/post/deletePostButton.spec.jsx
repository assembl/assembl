// @flow
import React from 'react';
import { Link } from 'react-router';
/* eslint-disable import/no-extraneous-dependencies */
import initStoryshots from '@storybook/addon-storyshots';
import { configure, shallow, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
/* eslint-enable */

import DeletePostButton from '../../../../../../js/app/components/debate/common/deletePostButton';
import type { DeletePostButtonProps } from '../../../../../../js/app/components/debate/common/deletePostButton';

// Separate the snapshots in directories next to each component
// Name should match with the story name
initStoryshots({
  storyKindRegex: /^DeletePostButton$/
});

configure({ adapter: new Adapter() });

describe('<DeletePostButton /> - with shallow', () => {
  let wrapper;

  beforeEach(() => {
    const deletePostButton: DeletePostButtonProps = {
      deletePost: jest.fn(),
      postId: '1234567890'
    };
    wrapper = shallow(<DeletePostButton {...deletePostButton} />);
  });

  it('should have a modal delete message set to "debate.confirmDeletionBody" as default', () => {
    expect(wrapper.prop('modalBodyMessage')).toEqual('debate.confirmDeletionBody');
  });
});

describe('<DeletePostButton /> - with mount', () => {
  let wrapper;

  beforeEach(() => {
    const deletePostButton: DeletePostButtonProps = {
      deletePost: jest.fn(),
      postId: '1234567890'
    };
    wrapper = mount(<DeletePostButton {...deletePostButton} />);
  });

  it('should render one Link with a delete icon embedded', () => {
    expect(wrapper.find(Link)).toHaveLength(1);
    expect(wrapper.find('span [className="assembl-icon-delete"]')).toHaveLength(1);
  });
});