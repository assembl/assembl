// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16.3';
/* eslint-enable */

import Loader, { LOADER_TYPE } from './loader';
import type { Props as LoaderProps } from './loader';

configure({ adapter: new Adapter() });

describe('<Loader /> - with shallow', () => {
  let wrapper;
  let loaderProps: LoaderProps;

  beforeEach(() => {
    loaderProps = {
      type: LOADER_TYPE.LOADING
    };
    wrapper = shallow(<Loader {...loaderProps}>description</Loader>);
  });

  describe('when is loading', () => {
    it('should render a loading icon', () => {
      expect(wrapper.contains('img [src="aaa"] [alt="aaa"]'));
    });

    it('should render a loading description', () => {
      expect(wrapper.find('p').text()).toEqual('aaa');
    });
  });
});