import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';

import { DumbAdminForm } from '../../../../js/app/components/form/adminForm';

describe('DumbAdminForm component', () => {
  const handleSubmitSpy = jest.fn();

  it('should render an admin form', () => {
    const setRouteLeaveHookSpy = jest.fn();
    const props = {
      handleSubmit: handleSubmitSpy,
      pristine: false,
      routes: [],
      router: {
        setRouteLeaveHook: setRouteLeaveHookSpy
      },
      submitting: false
    };

    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<DumbAdminForm {...props}>nothing</DumbAdminForm>);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });
});