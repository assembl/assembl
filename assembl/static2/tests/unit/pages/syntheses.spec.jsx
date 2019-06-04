import React from 'react';
import renderer from 'react-test-renderer';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16.3';

import { DumbSyntheses } from '../../../js/app/pages/syntheses';
import SynthesesList from '../../../js/app/components/synthesis/synthesesList';

configure({ adapter: new Adapter() });

describe('Syntheses component - with shallow', () => {
  let wrapper;
  let synthesesProps;
  beforeEach(() => {
    synthesesProps = {
      location: { state: undefined },
      hasSyntheses: true,
      syntheses: [
        {
          id: 'barId',
          subject: 'Bar',
          img: { externalUrl: 'http://foo.com/bar' },
          creationDate: '2017-02-10T09:15:20.707854+00:00',
          post: { id: 'someId' }
        },
        {
          id: 'fooId',
          subject: 'Foo',
          img: { externalUrl: 'http://foo.com/bar' },
          creationDate: '2018-02-10T09:15:20.707854+00:00',
          post: { id: 'someId' }
        }
      ],
      slug: 'fooslug'
    };
  });

  it('should render syntheses list', () => {
    wrapper = shallow(<DumbSyntheses {...synthesesProps} />);
    expect(wrapper.find('SynthesesList')).toHaveLength(1);
  });

  it('should render synthesis previews', () => {
    wrapper = shallow(<SynthesesList syntheses={synthesesProps.syntheses} />);
    expect(wrapper.find('SynthesisPreview')).toHaveLength(2);
  });

  it('should render synthesis previews in state order first then in date order', () => {
    wrapper = shallow(<SynthesesList syntheses={synthesesProps.syntheses} />);
    const listPreviews = wrapper.find('SynthesisPreview');
    expect(listPreviews.get(0).props.synthesis.subject).toEqual('Foo');
    expect(listPreviews.get(1).props.synthesis.subject).toEqual('Bar');
  });
});

describe('Syntheses component', () => {
  it('should match empty Syntheses snapshot', () => {
    const props = { location: { state: undefined }, hasSyntheses: false, syntheses: [] };
    const rendered = renderer.create(<DumbSyntheses {...props} />).toJSON();
    expect(rendered).toMatchSnapshot();
  });
});