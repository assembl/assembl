import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';

import {
  AssemblNavbar,
  sectionMapper,
  mapSectionToElement,
  __RewireAPI__ as NavbarRewireAPI
} from '../../../../js/app/components/navbar/navbar';

import rewireFunction from '../../../helpers/rewireFunction';

describe('sectionMapper function', () => {
  it('should return a function', () => {
    const ret = sectionMapper();
    expect(typeof ret).toBe('function');
  });
  it('should return a function that calls mapSectionToElement', () => {
    const mock = jest.fn();
    rewireFunction(NavbarRewireAPI, 'mapSectionToElement', mock, () => {
      const mapSection = sectionMapper();
      mapSection();
      expect(mock).toHaveBeenCalled();
    });
  });
  it('should return a function that returns mapSectionToElement\'s return value', () => {
    const mockReturn = { someProp: 'bar' };
    const mock = jest.fn(() => {
      return mockReturn;
    });
    rewireFunction(NavbarRewireAPI, 'mapSectionToElement', mock, () => {
      const mapSection = sectionMapper();
      const ret = mapSection();
      expect(ret).toBe(mockReturn);
    });
  });
  it('should return a function that calls mapSectionToElement with the function\'s argument and the sectionMapper\'s options', () => {
    const options = { someOption: true };
    const section = { someSectionProp: 'foo' };
    const mock = jest.fn();
    rewireFunction(NavbarRewireAPI, 'mapSectionToElement', mock, () => {
      const mapSection = sectionMapper(options);
      mapSection(section);
      expect(mock).toHaveBeenCalledWith(section, options);
    });
  });
});

describe('mapSectionToElement function', () => {
  it('should return a SectionLink element that matches the snapshot', () => {
    const ret = mapSectionToElement({ sectionType: 'DEBATE', title: 'fake_title' }, { slug: 'fake_slug', phase: 'fake_phase' });
    expect(ret).toMatchSnapshot();
  });
});

describe('AssemblNavbar component', () => {
  it('should render a FlatNavbar with a big screenWidth', () => {
    const renderer = new ShallowRenderer();
    renderer.render(
      <AssemblNavbar screenWidth={2000} phase={{ isRedirectionToV1: false }} debate={{ debateData: { timeline: [] } }} />
    );
    const result = renderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });
  it('should render a BurgerNavbar and a hidden FlatNavbar with a tiny screenWidth', () => {
    const renderer = new ShallowRenderer();
    renderer.render(
      <AssemblNavbar phase={{ isRedirectionToV1: false }} screenWidth={10} debate={{ debateData: { timeline: [] } }} />
    );
    const result = renderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });
});