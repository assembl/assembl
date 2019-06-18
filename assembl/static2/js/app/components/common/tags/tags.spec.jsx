// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import initStoryshots from '@storybook/addon-storyshots';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
/* eslint-enable */

import { DumbTags } from './tags';
import type { Props } from './tags';

initStoryshots({
  storyKindRegex: /^Tags\|TagContainer$/
});

configure({ adapter: new Adapter() });

describe('<Tags /> - with shallow', () => {
  let wrapper;
  let tagsProps: Props;

  beforeEach(() => {
    tagsProps = {
      tagsList: [{ id: 'Habitat et SDF', text: 'Habitat et SDF' }, { id: 'Facilitation', text: 'Facilitation' }],
      existingTags: [],
      initialExistingTags: [],
      postId: '0',
      addTag: jest.fn(),
      removeTag: jest.fn(),
      onTagListUpdateCallback: jest.fn(),
      updateTags: jest.fn()
    };
    wrapper = shallow(<DumbTags {...tagsProps} />);
  });

  it('should render a ReactTags component', () => {
    expect(wrapper.find('DragDropContext(ReactTags)')).toHaveLength(1);
  });
});