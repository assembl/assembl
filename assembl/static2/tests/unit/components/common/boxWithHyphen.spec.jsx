import React from 'react';
import renderer from 'react-test-renderer';

import BoxWithHyphen from '../../../../js/app/components/common/boxWithHyphen';

describe('BoxWithHyphen component', () => {
  it('should render a box with hyphen with its data', () => {
    const props = {
      additionalContainerClassNames: 'foobar',
      subject: 'Foobar',
      title: 'Synthesis',
      body: 'Lorem ipsum dolor sit amet',
      date: '2017-01-01T21:05:25.085948Z',
      href: 'http://www.example.com/foobar'
    };
    const component = renderer.create(<BoxWithHyphen {...props} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});