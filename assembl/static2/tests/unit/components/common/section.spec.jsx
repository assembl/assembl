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

  it('should match Section with 1 parent snapshot', () => {
    const rendered = renderer
      .create(
        <Section title="FooBar" parents={[1]} index={2} displayIndex>
          <div>Section content</div>
        </Section>
      )
      .toJSON();
    expect(rendered).toMatchSnapshot();
  });

  it('should match Section with 2 parents snapshot', () => {
    const rendered = renderer
      .create(
        <Section title="FooBar" parents={[1, 2]} index={2} displayIndex>
          <div>Section content</div>
        </Section>
      )
      .toJSON();
    expect(rendered).toMatchSnapshot();
  });

  it('should match Section with translate prop', () => {
    const rendered = renderer
      .create(
        <Section title="navbar.home" displayIndex translate>
          <div>Section content</div>
        </Section>
      )
      .toJSON();
    expect(rendered).toMatchSnapshot();
  });
});