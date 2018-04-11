import React from 'react';
import renderer from 'react-test-renderer';

import ParticipantsCount from '../../../../js/app/components/voteSession/participantsCount';
import '../../../helpers/setupTranslations';

describe('ParticipantsCount component', () => {
  it('should match ParticipantsCount snapshot', () => {
    const props = {
      count: 666
    };
    const rendered = renderer.create(<ParticipantsCount {...props} />).toJSON();
    expect(rendered).toMatchSnapshot();
  });
});