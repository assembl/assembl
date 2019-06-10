// @flow
import React from 'react';
import { Button } from 'react-bootstrap';
/* eslint-disable import/no-extraneous-dependencies */
import initStoryshots from '@storybook/addon-storyshots';
import { configure, shallow, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
/* eslint-enable */

import DeletePostButton from '../../../../../js/app/components/debate/common/deletePostButton';
import type { Props as DeletePostButtonProps } from '../../../../../js/app/components/debate/common/deletePostButton';
import { displayModal } from '../../../../../js/app/utils/utilityManager';

import DeletePostIcon from '../../../../../js/app/components/common/icons/deletePostIcon/deletePostIcon';

// Separate the snapshots in directories next to each component
// Name should match with the story name
initStoryshots({
  storyKindRegex: /^DeletePostButton$/
});

configure({ adapter: new Adapter() });

jest.mock('../../../../../js/app/utils/utilityManager');

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

  it('should render one Button with a delete icon embedded', () => {
    expect(wrapper.find(Button)).toHaveLength(1);
    expect(wrapper.find(DeletePostIcon)).toHaveLength(1);
  });

  it('should render one Button with a declined-checkbox icon embedded if the post is pending and you are a moderator', () => {
    wrapper.setProps({ isPendingForModerator: 'true' });
    expect(wrapper.find(Button)).toHaveLength(1);
    expect(wrapper.find('span[className="assembl-icon-check-box-declined"]')).toHaveLength(1);
  });

  it('should render a modal when you click on the button', () => {
    wrapper.simulate('click');
    expect(displayModal).toHaveBeenCalledTimes(1);
  });
});