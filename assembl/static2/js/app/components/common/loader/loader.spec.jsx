// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import initStoryshots from '@storybook/addon-storyshots';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
/* eslint-enable */

import Loader, { LOADER_TYPE } from './loader';
import type { Props as LoaderProps } from './loader';
import { defaultLoaderProps } from './loader.stories';
import LoadingIcon from '../icons/loadingIcon/loadingIcon';
import ErrorIcon from '../icons/errorIcon/errorIcon';
import NoDataIcon from '../icons/noDataIcon/noDataIcon';

// Separate the snapshots in directories next to each component
// Name should match with the story name
initStoryshots({
  storyKindRegex: /^Semantic\s{1}Analysis\|Loader$/
});

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
      expect(wrapper.find('p')).toHaveLength(1);
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
      expect(wrapper.find('p')).toHaveLength(1);
    });
  });

  describe('when is not enough data', () => {
    beforeEach(() => {
      loaderProps = {
        ...defaultLoaderProps,
        type: LOADER_TYPE.NO_DATA
      };
      wrapper = shallow(<Loader {...loaderProps} />);
    });

    it('should render an error icon', () => {
      expect(wrapper.find(NoDataIcon)).toHaveLength(1);
    });

    it('should render a loading description', () => {
      expect(wrapper.find('p')).toHaveLength(1);
    });
  });
});