import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';

import Tags from '../../../../js/app/components/harvesting/tags';

const tags = [{ label: 'foo', value: 'fooid' }, { label: 'bar', value: 'barid' }];

describe('Tags component', () => {
  const updateTags = jest.fn(() => {});

  it('should match Tags snapshot', () => {
    const props = {
      initialValues: tags,
      updateTags: updateTags,
      canEdit: true
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<Tags {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });

  it('should match Tags snapshot (user can\'t edit)', () => {
    const props = {
      initialValues: tags,
      updateTags: updateTags,
      canEdit: false
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<Tags {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });

  it('should match Tags snapshot without initialValues', () => {
    const props = {
      initialValues: [],
      updateTags: updateTags,
      canEdit: true
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<Tags {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });
});