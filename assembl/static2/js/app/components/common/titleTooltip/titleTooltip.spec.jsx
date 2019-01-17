// @flow
import React from 'react';
// Text import for alt image
import { I18n } from 'react-redux-i18n';
/* eslint-disable import/no-extraneous-dependencies */
import initStoryshots from '@storybook/addon-storyshots';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16.3';
// Helper imports
import { getIconPath } from '../../../utils/globalFunctions';
/* eslint-enable */

import TitleTooltip from './titleTooltip';
import type { Props as TitleTooltipProps } from './titleTooltip';
import { defaultTitleTooltipProps } from './titleTooltip.stories';

// Separate the snapshots in directories next to each component
// Name should match with the story name
initStoryshots({
  storyKindRegex: /^TitleTooltip$/
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
    const tooltipIconPatch = getIconPath('tooltipIcon.svg');
    const tooltipIconAlt = I18n.t('common.icons.tooltip');
    expect(wrapper.find(`img [src="${tooltipIconPatch}"] [alt="${tooltipIconAlt}"] [className="tooltip-icon"]`)).toHaveLength(1);
  });

  it('should use an ResponsiveOverlayTrigger', () => {
    expect(wrapper.find('ResponsiveOverlayTrigger')).toHaveLength(1);
  });
});