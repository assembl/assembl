import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';

import { DumbTagsForm } from '../../../../js/app/components/harvesting/tagsForm';

const tags = [{ label: 'foo', value: 'fooid' }, { label: 'bar', value: 'barid' }];

describe('Tags component', () => {
  const footer = 'Form footer';

  it('should match the form footer', () => {
    const props = {
      initialValues: tags,
      onSubmit: jest.fn(() => {}),
      renderFooter: () => <div>{footer}</div>
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<DumbTagsForm {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });
});