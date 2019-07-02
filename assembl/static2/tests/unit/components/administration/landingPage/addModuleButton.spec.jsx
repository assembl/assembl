import React from 'react';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import renderer from 'react-test-renderer';

import AddModuleButton from '../../../../../js/app/components/administration/landingPage/addModuleButton';
import { displayModal } from '../../../../../js/app/utils/utilityManager';

configure({ adapter: new Adapter() });

jest.mock('../../../../../js/app/utils/utilityManager');

describe('AddModuleButton component', () => {
  const createModuleSpy = jest.fn(() => {});
  const props = {
    createModule: createModuleSpy,
    numberOfDuplicatesModules: 3,
    numberOfEnabledModules: 12,
    allDuplicatesAreChecked: true,
    buttonTitleTranslationKey: 'textAndMultimediaBtn'
  };
  const wrapper = shallow(<AddModuleButton {...props} />);

  it('should render a non disabled button', () => {
    expect(wrapper.find('Button[disabled=false]')).toHaveLength(1);
  });

  it('should render a disabled button', () => {
    wrapper.setProps({ allDuplicatesAreChecked: false });
    expect(wrapper.find('Button[disabled=true]')).toHaveLength(1);
  });

  it('should render a modal when you click on the button', () => {
    wrapper.simulate('click');
    expect(displayModal).toHaveBeenCalledTimes(1);
  });

  it('should match the snapshot', () => {
    const component = renderer.create(<AddModuleButton {...props} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});