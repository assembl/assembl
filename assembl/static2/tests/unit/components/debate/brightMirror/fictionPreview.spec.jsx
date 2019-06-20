// @flow
import React from 'react';
import initStoryshots from '@storybook/addon-storyshots';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

import FictionPreview from '../../../../../js/app/components/debate/brightMirror/fictionPreview';
import EditPostButton from '../../../../../js/app/components/debate/common/editPostButton';
import DeletePostButton from '../../../../../js/app/components/debate/common/deletePostButton';
import SharePostButton from '../../../../../js/app/components/debate/common/sharePostButton';
import { customFictionPreview } from '../../../../../js/app/stories/components/debate/brightMirror/fictionPreview.stories';
import { PublicationStates } from '../../../../../js/app/constants';

// Separate the snapshots in directories next to each component
// Name should match with the story name
initStoryshots({
  storyKindRegex: /^FictionPreview$/
});

configure({ adapter: new Adapter() });

// Mock utils functions
jest.mock('../../../../../js/app/utils/globalFunctions', () => ({
  isMobile: { any: jest.fn(() => false) },
  getIconPath: jest.fn(() => 'icons/path/avatar'),
  getPictureUrl: jest.fn(() => 'https://s3-eu-west-1.amazonaws.com/bluenove-assembl-images/bm/preview-xx.jpg')
}));

describe('<FictionPreview /> - with shallow', () => {
  let wrapper;
  let fictionPreview;

  describe('when publication state is published', () => {
    beforeEach(() => {
      fictionPreview = {
        ...customFictionPreview,
        publicationState: PublicationStates.PUBLISHED
      };
      wrapper = shallow(<FictionPreview {...fictionPreview} />);
    });

    it('should render title', () => {
      expect(wrapper.find('h3')).toHaveLength(1);
    });

    it('should render author name', () => {
      expect(wrapper.find('span[className="author"]')).toHaveLength(1);
    });

    it('should render creation date', () => {
      expect(wrapper.find('span[className="published-date"]')).toHaveLength(1);
    });

    it('should render edit button when userCanEdit is true', () => {
      expect(wrapper.find(EditPostButton)).toHaveLength(1);
    });

    it('should render delete button when userCanDelete is true', () => {
      expect(wrapper.find(DeletePostButton)).toHaveLength(1);
    });

    it('should not render edit button when userCanEdit is false', () => {
      wrapper.setProps({ userCanEdit: false });
      expect(wrapper.find(EditPostButton)).toHaveLength(0);
    });

    it('should not render delete button when userCanDelete is false', () => {
      wrapper.setProps({ userCanDelete: false });
      expect(wrapper.find(DeletePostButton)).toHaveLength(0);
    });

    it('should render share button', () => {
      expect(wrapper.find(SharePostButton)).toHaveLength(1);
    });

    it('should not render draft label', () => {
      expect(wrapper.find('span[className="draft-label"]')).toHaveLength(0);
    });
  });

  describe('when publication state is draft', () => {
    beforeEach(() => {
      fictionPreview = {
        ...customFictionPreview,
        publicationState: PublicationStates.DRAFT
      };
      wrapper = shallow(<FictionPreview {...fictionPreview} />);
    });

    it('should render draft label', () => {
      expect(wrapper.find('div[className="draft-label"]')).toHaveLength(1);
    });

    it('should not render share button', () => {
      expect(wrapper.find(SharePostButton)).toHaveLength(0);
    });
  });
});