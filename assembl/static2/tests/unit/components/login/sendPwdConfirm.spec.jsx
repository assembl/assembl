import React from 'react';
import renderer from 'react-test-renderer';

import SendPwdConfirm from '../../../../js/app/components/login/sendPwdConfirm';

describe('SendPwdConfirm component', () => {
  it('should match the snapshot', () => {
    const component = renderer.create(<SendPwdConfirm />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});