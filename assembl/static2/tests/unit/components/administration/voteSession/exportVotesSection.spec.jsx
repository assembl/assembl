// @flow
import { configure, mount, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import React from 'react';
import renderer from 'react-test-renderer';

import ExportVotesSection from '../../../../../js/app/components/administration/voteSession/exportVotesSection';

configure({ adapter: new Adapter() });

describe('ExportVotesSection component', () => {
  const props = {
    debateId: 'my-debate',
    voteSessionId: 'my-vote-session'
  };

  it('should render an export section for votes', () => {
    const component = renderer.create(<ExportVotesSection {...props} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should set exportRoute state when user clicks on radio button', () => {
    const wrapper = mount(<ExportVotesSection {...props} />);
    const options = wrapper.find('input');
    expect(wrapper.state('exportRoute')).toEqual('vote_results_csv');
    const eventMock = {
      target: {
        value: 'extract_csv_voters'
      }
    };
    options.last().simulate('change', eventMock);
    expect(wrapper.state('exportRoute')).toEqual('extract_csv_voters');
    eventMock.target.value = 'vote_results_csv';
    options.first().simulate('change', eventMock);
    expect(wrapper.state('exportRoute')).toEqual('vote_results_csv');
  });

  describe('getExportLink method', () => {
    it('should return a link to export votes', () => {
      const wrapper = shallow(<ExportVotesSection {...props} />);
      const actual = wrapper.instance().getExportLink();
      const expected = '/data/Discussion/my-debate/widgets/my-vote-session/vote_results_csv';
      expect(actual).toEqual(expected);
    });

    it('should return a link to export csv voters', () => {
      const wrapper = shallow(<ExportVotesSection {...props} />);
      wrapper.instance().setState({ exportRoute: 'extract_csv_voters' });
      const actual = wrapper.instance().getExportLink();
      const expected = '/data/Discussion/my-debate/widgets/my-vote-session/extract_csv_voters';
      expect(actual).toEqual(expected);
    });
  });
});