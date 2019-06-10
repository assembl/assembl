// @flow
import React from 'react';
// Text import for alt image
/* eslint-disable import/no-extraneous-dependencies */
import initStoryshots from '@storybook/addon-storyshots';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
/* eslint-enable */

import TitleTooltip from './titleTooltip';
import type { Props as TitleTooltipProps } from './titleTooltip';
import { defaultTitleTooltipProps } from './titleTooltip.stories';

// Separate the snapshots in directories next to each component
// Name should match with the story name
initStoryshots({
  storyKindRegex: /^Semantic\s{1}Analysis\|TitleTooltip$/
});

configure({ adapter: new Adapter() });

describe('<TitleTooltip /> - with shallow', () => {
  let wrapper;
  let tooltipProps: TitleTooltipProps;

  beforeEach(() => {
    tooltipProps = { ...defaultTitleTooltipProps };
    wrapper = shallow(<TitleTooltip {...tooltipProps} />);
  });

  it('should render an tooltip icon', () => {
    expect(wrapper.find('TooltipIcon')).toHaveLength(1);
  });

  it('should use an ResponsiveOverlayTrigger', () => {
    expect(wrapper.find('ResponsiveOverlayTrigger')).toHaveLength(1);
  });
});