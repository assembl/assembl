// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16.3';
/* eslint-enable */

import SemanticAnalysis from './semanticAnalysis';
import Loader from '../../../components/common/loader/loader';

configure({ adapter: new Adapter() });

describe('<SemanticAnalysis /> - with shallow', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<SemanticAnalysis />);
  });

  it('should render a Loader component', () => {
    expect(wrapper.find(Loader)).toHaveLength(1);
  });
});