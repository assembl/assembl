import { configure, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16.3';
import React from 'react';
import renderer from 'react-test-renderer';

import ExportSection from '../../../../js/app/components/administration/exportSection';

configure({ adapter: new Adapter() });

describe('ExportSection component', () => {
  it('should render an ExportSection component without languages options', () => {
    const props = {
      voteSessionId: '123',
      debateId: '7',
      exportLink: 'foo.com'
    };
    const component = renderer.create(<ExportSection {...props} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should render an ExportSection component with languages options', () => {
    const handleExportLocaleChangeSpy = jest.fn(() => {});
    const handleTranslationChangeSpy = jest.fn(() => {});
    const props = {
      voteSessionId: '123',
      debateId: '7',
      withLanguageOptions: true,
      exportLink: 'foo.com',
      handleExportLocaleChange: handleExportLocaleChangeSpy,
      handleTranslationChange: handleTranslationChangeSpy,
      languages: [
        { locale: 'fr', name: 'French', nativeName: 'français', __typename: 'LocalePreference' },
        { locale: 'en', name: 'English', nativeName: 'English', __typename: 'LocalePreference' }
      ]
    };
    const component = renderer.create(<ExportSection {...props} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should render an export section that handles different export links', () => {
    const props = {
      voteSessionId: '123',
      debateId: '7',
      exportLink: [{ msgId: 'vote.voteResultsCsv', url: 'foo.com' }, { msgId: 'vote.extractCsvVoters', url: 'bar.org' }]
    };
    const component = renderer.create(<ExportSection {...props} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should update exportLink in state when user clicks on on export link option', () => {
    const props = {
      voteSessionId: '123',
      debateId: '7',
      exportLink: [
        {
          msgId: 'vote.voteResultsCsv',
          url: 'http://url/to/vote_results_csv'
        },
        {
          msgId: 'vote.extractCsvVoters',
          url: 'http://url/to/extract_csv_voters'
        }
      ]
    };
    const wrapper = mount(<ExportSection {...props} />);
    const options = wrapper.find('input[name="exportLink"]');
    expect(wrapper.state('exportLink')).toEqual('http://url/to/vote_results_csv');
    const eventMock = {
      target: {
        value: 'http://url/to/extract_csv_voters'
      }
    };
    options.last().simulate('change', eventMock);
    expect(wrapper.state('exportLink')).toEqual('http://url/to/extract_csv_voters');
    eventMock.target.value = 'http://url/to/vote_results_csv';
    options.first().simulate('change', eventMock);
    expect(wrapper.state('exportLink')).toEqual('http://url/to/vote_results_csv');
  });
});