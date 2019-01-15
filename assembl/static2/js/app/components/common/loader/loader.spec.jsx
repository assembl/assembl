// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16.3';
/* eslint-enable */

import Loader, { LOADER_TYPE_CONTENT, LOADER_TYPE } from './loader';
import type { Props as LoaderProps } from './loader';
import { defaultLoaderProps } from './loader.stories';
import LoadingIcon from './icons/loadingIcon/loadingIcon';
import ErrorIcon from './icons/errorIcon/errorIcon';

configure({ adapter: new Adapter() });

describe('<Loader /> - with shallow', () => {
  let wrapper;
  let loaderProps: LoaderProps;

  describe('when is loading', () => {
    beforeEach(() => {
      loaderProps = { ...defaultLoaderProps };
      wrapper = shallow(<Loader {...loaderProps} />);
    });

    it('should render a loading icon', () => {
      expect(wrapper.find(LoadingIcon)).toHaveLength(1);
    });

    it('should render a loading description', () => {
      const { description } = LOADER_TYPE_CONTENT.LOADING;
      expect(wrapper.find('p').text()).toEqual(description);
    });
  });

  describe('when is error', () => {
    beforeEach(() => {
      loaderProps = {
        ...defaultLoaderProps,
        type: LOADER_TYPE.ERROR
      };
      wrapper = shallow(<Loader {...loaderProps} />);
    });

    it('should render an error icon', () => {
      expect(wrapper.find(ErrorIcon)).toHaveLength(1);
    });

    it('should render a loading description', () => {
      const { description } = LOADER_TYPE_CONTENT.ERROR;
      expect(wrapper.find('p').text()).toEqual(description);
    });
  });
});