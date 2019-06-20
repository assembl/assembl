import * as React from 'react';
import { shallow, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import { DumbApp } from '../../js/app/app';
import { MESSAGE_VIEW } from '../../js/app/constants';

configure({ adapter: new Adapter() });

jest.mock('../../js/app/utils/globalFunctions');

describe('App component', () => {
  const debate = {
    debateData: { slug: 'foobar' },
    debateLoading: false,
    debateError: null
  };
  const props = {
    addContext: jest.fn(),
    debate: debate,
    fetchDebateData: jest.fn(),
    location: {},
    params: {},
    putTimelineInStore: jest.fn(),
    route: {},
    timeline: {},
    timelineLoading: false,
    isHarvesting: false,
    isDebateModerated: true,
    connectedUserId: '1234'
  };
  describe('DebateContext', () => {
    it('should pass the correct values to the Context Provider', () => {
      const wrapper = shallow(<DumbApp {...props} />);
      const contextValue = wrapper.find('ContextProvider').prop('value');
      delete contextValue.modifyContext;
      expect(contextValue).toEqual({
        connectedUserId: '1234',
        isDebateModerated: true,
        isHarvesting: false,
        isHarvestable: false,
        messageViewOverride: MESSAGE_VIEW.noModule
      });
    });
  });
});