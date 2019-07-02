import { mount, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import React from 'react';
import renderer from 'react-test-renderer';

import RequestNewPasswordForm from '../../../../js/app/components/login/requestNewPasswordForm';

configure({ adapter: new Adapter() });

jest.mock('../../../../js/app/utils/globalFunctions');

describe('RequestNewPasswordForm component', () => {
  const requestPasswordChangeSpy = jest.fn();
  const preventDefaultSpy = jest.fn();
  const props = {
    passwordChangeResponse: {
      success: null
    },
    requestPasswordChange: requestPasswordChangeSpy
  };

  it('should match the snapshot', () => {
    const component = renderer.create(<RequestNewPasswordForm {...props} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should handle identifier change', () => {
    const wrapper = mount(<RequestNewPasswordForm {...props} />);
    expect(wrapper.state('identifier')).toBeNull();
    const e = {
      currentTarget: {
        value: 'new value'
      }
    };
    wrapper.instance().handleIdentifierChange(e);
    expect(wrapper.state('identifier')).toBe('new value');
  });

  it('should handle submit', () => {
    const wrapper = mount(<RequestNewPasswordForm {...props} />);
    wrapper.instance().state.identifier = 'cedric';
    const e = {
      preventDefault: preventDefaultSpy
    };
    wrapper.instance().handleSubmit(e);
    expect(requestPasswordChangeSpy).toHaveBeenCalledWith('cedric', 'my-debate-slug');
    expect(preventDefaultSpy).toHaveBeenCalled();
  });
});