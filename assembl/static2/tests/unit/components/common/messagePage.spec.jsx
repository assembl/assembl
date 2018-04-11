import React from 'react';
import renderer from 'react-test-renderer';

import MessagePage from '../../../../js/app/components/common/messagePage';
import '../../../helpers/setupTranslations';

describe('MessagePage component', () => {
  it('should render a MessagePage component', () => {
    const component = renderer.create(
      <MessagePage
        title="Supply chains"
        text="The SCSI circuit is down, reboot the 1080p microchip so we can connect the RAM system!"
      />
    );
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});