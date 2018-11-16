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
      video: {
        descriptionEntriesTop: {
          en: 'The description'
        },
        titleEntries: {
          fr: 'Titre de la vidéo',
          en: 'Video title'
        },
        videoUrl: 'http://vimeo.com/v/87387364'
      }
    };
    wrapper = shallow(<Video {...videoProps} />);
    expect(wrapper.contains('Titre de la vidéo')).toBe(true);
  });

  it('should display the title from the debateData object in english', () => {
    const videoProps: Props = {
      locale: 'en',
      video: {
        descriptionEntriesTop: {
          en: 'Lorem ipsum'
        },
        titleEntries: {
          fr: 'Titre de la vidéo',
          en: 'Video title'
        },
        videoUrl: 'http://vimeo.com/v/787666'
      }
    };
    wrapper = shallow(<Video {...videoProps} />);
    expect(wrapper.contains('Video title')).toBe(true);
  });

  it('should display the title from the translations file', () => {
    const videoProps: Props = {
      locale: 'en',
      video: {
        descriptionEntriesTop: null,
        titleEntries: null,
        videoUrl: ''
      }
    };
    wrapper = shallow(<Video {...videoProps} />);
    expect(wrapper.find('Translate')).toHaveLength(1);
  });

  it('should display the video text from the debateData object in french', () => {
    const videoProps: Props = {
      locale: 'fr',
      video: {
        descriptionEntriesTop: {
          fr: 'Texte de la vidéo',
          en: 'Video text'
        },
        titleEntries: null,
        videoUrl: ''
      }
    };
    wrapper = shallow(<Video {...videoProps} />);
    expect(wrapper.contains('Texte de la vidéo')).toBe(true);
  });

  it('should display the video text from the debateData object in english', () => {
    const videoProps: Props = {
      locale: 'en',
      video: {
        descriptionEntriesTop: {
          fr: 'Texte de la vidéo',
          en: 'Video text'
        },
        titleEntries: null,
        videoUrl: ''
      }
    };
    wrapper = shallow(<Video {...videoProps} />);
    expect(wrapper.contains('Video text')).toBe(true);
  });

  it('should display the Medias component when the video url exists', () => {
    const videoProps: Props = {
      locale: 'en',
      video: {
        descriptionEntriesTop: null,
        titleEntries: null,
        videoUrl: 'fakeurl.com'
      }
    };
    wrapper = shallow(<Video {...videoProps} />);
    expect(wrapper.find(Medias)).toHaveLength(1);
  });

  it('should not display the Medias component when the video url is null', () => {
    const videoProps: Props = {
      locale: 'en',
      video: {
        descriptionEntriesTop: null,
        titleEntries: null,
        videoUrl: null
      }
    };
    wrapper = shallow(<Video {...videoProps} />);
    expect(wrapper.find(Medias)).toHaveLength(0);
  });
});