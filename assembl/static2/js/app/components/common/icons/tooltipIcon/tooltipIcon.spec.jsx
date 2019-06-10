// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16.3';
/* eslint-enable */

import TooltipIcon from './tooltipIcon';

configure({ adapter: new Adapter() });

describe('<TooltipIcon /> - with shallow', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<TooltipIcon />);
  });

  it('should render a tooltip icon', () => {
    expect(wrapper.find('svg[className="icon tooltip"]')).toHaveLength(1);
    expect(wrapper.find('text[className="text"]')).toHaveLength(1);
    expect(wrapper.find('circle[className="circle"]')).toHaveLength(1);
  });
});