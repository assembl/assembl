// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import initStoryshots from '@storybook/addon-storyshots';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
/* eslint-enable */

import TitleWithTooltip from './titleWithTooltip';
import type { Props as TitleWithTooltipProps } from './titleWithTooltip';
import { displayModal } from '../../../utils/utilityManager';
import { defaultTitleWithTooltipProps } from './titleWithTooltip.stories';

// Separate the snapshots in directories next to each component
// Name should match with the story name
initStoryshots({
  storyKindRegex: /^Semantic\s{1}Analysis\|TitleWithTooltip$/
});

jest.mock('../../../utils/utilityManager', () => ({ displayModal: jest.fn() }));
jest.mock('../../../utils/globalFunctions', () => ({
  isMobile: { any: jest.fn(() => true) },
  getIconPath: jest.fn(() => 'icons/path/info')
}));

configure({ adapter: new Adapter() });

describe('<TitleWithTooltip /> - with shallow', () => {
  let wrapper;
  let titleTooltipProps: TitleWithTooltipProps;

  beforeEach(() => {
    titleTooltipProps = defaultTitleWithTooltipProps;
    wrapper = shallow(<TitleWithTooltip {...titleTooltipProps} />);
  });

  it('should render a title component', () => {
    expect(wrapper.find('Title')).toHaveLength(1);
  });

  it('should render a tooltip component', () => {
    expect(wrapper.find('TitleTooltip')).toHaveLength(1);
  });

  it('should render a modal when you click on the icon', () => {
    wrapper.find('div[className="titleTooltip-container"]').simulate('click');
    expect(displayModal).toHaveBeenCalledTimes(1);
  });
});