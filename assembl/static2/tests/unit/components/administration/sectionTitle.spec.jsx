import React from 'react';
import renderer from 'react-test-renderer';

import SectionTitle from '../../../../js/app/components/administration/sectionTitle';

describe('SectionTitle component', () => {
  it('should render an admin section title', () => {
    const component = renderer.create(<SectionTitle title="Mon titre de section" annotation="foobar" />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});