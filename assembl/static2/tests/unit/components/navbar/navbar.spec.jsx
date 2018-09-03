import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';

import { AssemblNavbar, mapSectionToElement } from '../../../../js/app/components/navbar/navbar';
import '../../../helpers/setupTranslations';

describe('mapSectionToElement function', () => {
  it('should return a SectionLink element that matches the snapshot', () => {
    const ret = mapSectionToElement({ sectionType: 'DEBATE', title: 'fake_title' }, { slug: 'fake_slug', phase: 'fake_phase' });
    expect(ret).toMatchSnapshot();
  });
});

const data = {
  sectionData: {
    hasResourcesCenter: false,
    hasSyntheses: false,
    sections: [
      {
        id: 'home',
        sectionType: 'HOMEPAGE',
        title: 'Home',
        url: 'http://www.homesweethome.org'
      },
      {
        id: 'mysection',
        sectionType: 'CUSTOM',
        title: 'My section',
        url: 'http://www.gnu.org'
      }
    ]
  },
  discussionData: {
    loginData: {
      route: 'http://www.mycoolsite.com/login',
      local: false
    }
  },
  discussionLoading: false,
  sectionloading: false
};

describe('AssemblNavbar component', () => {
  it('should render a FlatNavbar with a big screenWidth', () => {
    const renderer = new ShallowRenderer();
    renderer.render(
      <AssemblNavbar
        screenWidth={2000}
        phase={{ isRedirectionToV1: false }}
        debate={{ debateData: { timeline: [] } }}
        {...data}
      />
    );
    const result = renderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });

  it('should render a BurgerNavbar and a hidden FlatNavbar with a tiny screenWidth', () => {
    const renderer = new ShallowRenderer();
    renderer.render(
      <AssemblNavbar
        phase={{ isRedirectionToV1: false }}
        screenWidth={10}
        debate={{ debateData: { timeline: [] } }}
        {...data}
      />
    );
    const result = renderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });
});