// @flow
import React from 'react';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

import type { Props } from '../../../../js/app/components/home/video';
import { Video } from '../../../../js/app/components/home/video';
import Medias from '../../../../js/app/components/common/medias';

configure({ adapter: new Adapter() });

describe('<Video /> - with shallow', () => {
  let wrapper;

  it('should display the title from the debateData object in french', () => {
    const videoProps: Props = {
      locale: 'fr',
      debateData: {
        video: {
          titleEntries: {
            fr: 'Titre de la vidéo',
            en: 'Video title'
          }
        }
      }
    };
    wrapper = shallow(<Video {...videoProps} />);
    expect(wrapper.contains('Titre de la vidéo')).toBe(true);
  });

  it('should display the title from the debateData object in english', () => {
    const videoProps: Props = {
      locale: 'en',
      debateData: {
        video: {
          titleEntries: {
            fr: 'Titre de la vidéo',
            en: 'Video title'
          }
        }
      }
    };
    wrapper = shallow(<Video {...videoProps} />);
    expect(wrapper.contains('Video title')).toBe(true);
  });

  it('should display the title from the translations file', () => {
    const videoProps: Props = {
      debateData: {
        video: {
          titleEntries: null
        }
      }
    };
    wrapper = shallow(<Video {...videoProps} />);
    expect(wrapper.find('Translate')).toHaveLength(1);
  });

  it('should display the video text from the debateData object in french', () => {
    const videoProps: Props = {
      locale: 'fr',
      debateData: {
        video: {
          descriptionEntriesTop: {
            fr: 'Texte de la vidéo',
            en: 'Video text'
          }
        }
      }
    };
    wrapper = shallow(<Video {...videoProps} />);
    expect(wrapper.contains('Texte de la vidéo')).toBe(true);
  });

  it('should display the video text from the debateData object in english', () => {
    const videoProps: Props = {
      locale: 'en',
      debateData: {
        video: {
          descriptionEntriesTop: {
            fr: 'Texte de la vidéo',
            en: 'Video text'
          }
        }
      }
    };
    wrapper = shallow(<Video {...videoProps} />);
    expect(wrapper.contains('Video text')).toBe(true);
  });

  it('should display the Medias component when the video url exists', () => {
    const videoProps: Props = {
      debateData: {
        video: {
          videoUrl: 'fakeurl.com'
        }
      }
    };
    wrapper = shallow(<Video {...videoProps} />);
    expect(wrapper.find(Medias)).toHaveLength(1);
  });

  it('should not display the Medias component when the video url is null', () => {
    const videoProps: Props = {
      debateData: {
        video: {
          videoUrl: null
        }
      }
    };
    wrapper = shallow(<Video {...videoProps} />);
    expect(wrapper.find(Medias)).toHaveLength(0);
  });
});