import React from 'react';
import renderer from 'react-test-renderer';

import Section from '../../../../js/app/components/common/section';

describe('Section component', () => {
  it('should match Section snapshot', () => {
    const rendered = renderer
      .create(
        <Section title="FooBar">
          <div>Section content</div>
        </Section>
      )
      .toJSON();
    expect(rendered).toMatchSnapshot();
  });
});