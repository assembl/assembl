// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import initStoryshots from '@storybook/addon-storyshots';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
/* eslint-enable */

import Description from './description';

initStoryshots({
  storyKindRegex: /^Semantic\s{1}Analysis\|Description$/
});

configure({ adapter: new Adapter() });

describe('<Description /> - with shallow', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(
      <Description>
        <p>My awesome paragraph description</p>
      </Description>
    );
  });

  it('should render a unique div which has a classname', () => {
    expect(wrapper.find('div[className="description"]')).toHaveLength(1);
  });

  it('should render children props', () => {
    expect(wrapper.contains(<p>My awesome paragraph description</p>)).toEqual(true);
  });
});