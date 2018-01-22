import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';

import TestedComponent from '../../../../js/app/components/common/textAreaWithRemainingChars';

describe('TextAreaWithRemainingChars component', () => {
  const onChangeSpy = jest.fn(() => {});
  const onClickSpy = jest.fn(() => {});
  it('should render a textarea field with a limited number of characters (empty value)', () => {
    const props = {
      domId: 'my-textarea',
      maxLength: 600,
      placeholder: 'Use the mobile ADP capacitor, then you can calculate the mobile port!',
      rows: 4,
      onChange: onChangeSpy,
      onClick: onClickSpy,
      value: ''
    };
    const renderer = new ShallowRenderer();
    renderer.render(<TestedComponent {...props} />);
    const rendered = renderer.getRenderOutput();
    expect(rendered).toMatchSnapshot();
  });

  it('should render a textarea field with a limited number of characters', () => {
    const props = {
      domId: 'my-textarea',
      maxLength: 600,
      placeholder: 'Use the mobile ADP capacitor, then you can calculate the mobile port!',
      rows: 4,
      onChange: onChangeSpy,
      onClick: onClickSpy,
      value: 'Try to bypass the USB port, maybe it will generate the wireless sensor!'
    };
    const renderer = new ShallowRenderer();
    renderer.render(<TestedComponent {...props} />);
    const rendered = renderer.getRenderOutput();
    expect(rendered).toMatchSnapshot();
  });
});