// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16.3';
/* eslint-enable */

// Helper imports
import { I18n } from 'react-redux-i18n';
import { getIconPath } from '../../../../../utils/globalFunctions';

import ErrorIcon from './errorIcon';

configure({ adapter: new Adapter() });

describe('<ErrorIcon /> - with shallow', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<ErrorIcon />);
  });

  it('should render an error icon', () => {
    const errorIconPatch = getIconPath('error-icon.svg');
    const errorIconAlt = I18n.t('common.icons.error');
    expect(wrapper.find(`img [src="${errorIconPatch}"] [alt="${errorIconAlt}"] [className="icon"]`)).toHaveLength(1);
  });
});