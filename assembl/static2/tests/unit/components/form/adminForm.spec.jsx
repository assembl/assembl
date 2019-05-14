import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';

import AdminForm from '../../../../js/app/components/form/adminForm';

describe('AdminForm component', () => {
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
    shallowRenderer.render(<AdminForm {...props}>nothing</AdminForm>);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });
});