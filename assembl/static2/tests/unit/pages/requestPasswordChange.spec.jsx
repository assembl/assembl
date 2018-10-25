import React from 'react';
import renderer from 'react-test-renderer';

import { DumbRequestPasswordChange } from '../../../js/app/pages/requestPasswordChange';

describe('RequestPasswordChange component', () => {
  const requestPasswordChangeSpy = jest.fn();
  it('should display confirm page if request was sent successfully', () => {
    const props = {
      passwordChangeResponse: {
        success: true
      },
      requestPasswordChange: requestPasswordChangeSpy
    };
    const component = renderer.create(<DumbRequestPasswordChange {...props} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should display request password change form if request was not sent', () => {
    const props = {
      passwordChangeResponse: {
        success: false
      },
      requestPasswordChange: requestPasswordChangeSpy
    };
    const component = renderer.create(<DumbRequestPasswordChange {...props} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});