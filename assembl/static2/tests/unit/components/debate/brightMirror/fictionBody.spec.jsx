// @flow
import React from 'react';
import { configure, mount, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import { MockedProvider } from 'react-apollo/test-utils';
import configureStore from 'redux-mock-store';

import renderer from 'react-test-renderer';
import PostBody from '../../../../../js/app/components/debate/common/post/postBody';
import type { Props as FictionBodyProps } from '../../../../../js/app/components/debate/brightMirror/fictionBody';
import FictionBody from '../../../../../js/app/components/debate/brightMirror/fictionBody';
import { defaultDisplayPolicy, defaultOrderPolicy } from '../../../../../js/app/components/debate/common/postsFilter/policies';

configure({ adapter: new Adapter() });

const defaultIdeaId: string = '0';
const defaultId: string = '0';
const defaultTitle: string = 'Fugit veritatis nemo';
const defaultContent: string = 'Vero et ut et quia quo. Molestiae ut cupiditate odio numquam veniam esse cumque modi.';
const defaultLocale: string = 'en';
const defaultExtracts: Array<FictionExtractFragment> = [];
const defaultIsAuthorAccountDeleted: boolean = false;
const defaultDbId: number = 1;
const bodyMimeType: string = 'text/html';
const refetchPost: Function = jest.fn();

const mockStore = configureStore();
const initialState = {
  threadFilter: {
    postsFilters: {
      onlyMyPosts: false,
      myPostsAndAnswers: false
    },
    postsDisplayPolicy: defaultDisplayPolicy,
    postsOrderPolicy: defaultOrderPolicy
  }
};

const defaultFictionBody: FictionBodyProps = {
  ideaId: defaultIdeaId,
  postId: defaultId,
  title: defaultTitle,
  content: defaultContent,
  contentLocale: defaultLocale,
  lang: defaultLocale,
  extracts: defaultExtracts,
  isAuthorAccountDeleted: defaultIsAuthorAccountDeleted,
  dbId: defaultDbId,
  bodyMimeType: bodyMimeType,
  refetchPost: refetchPost,
  userCanReply: false,
  mySentiment: 'LIKE',
  sentimentCounts: {
    disagree: 0,
    dontUnderstand: 0,
    like: 0,
    moreInfo: 0
  },
  isPhaseCompleted: false,
  screenWidth: 100
};

describe('<FictionBody /> - with shallow', () => {
  let wrapper;
  let fictionBody: FictionBodyProps;

  beforeEach(() => {
    window.getSelection = () => ({
      removeAllRanges: () => {}
    });
    // disableLifecycleMethods to prevent consulting the DOM
    wrapper = shallow(<FictionBody {...fictionBody} />, { disableLifecycleMethods: true });
  });

  it('should render post body', () => {
    expect(wrapper.find(PostBody)).toHaveLength(1);
  });
});

describe('<FictionBody /> - with mount', () => {
  let wrapper;
  let fictionBody: FictionBodyProps;

  beforeEach(() => {
    window.getSelection = () => ({
      removeAllRanges: () => {}
    });
    // Create DOM to allow document.getElementById function
    const div = document.createElement('div');
    window.domNode = div;
    // $FlowFixMe because document.body may be null
    document.body.appendChild(div);
    fictionBody = { ...defaultFictionBody };
    const store = mockStore(initialState);
    wrapper = mount(
      <MockedProvider store={store}>
        <FictionBody {...fictionBody} />
      </MockedProvider>,
      { attachTo: window.domNode }
    );
  });

  it('should display the fiction content', () => {
    const fictionContent: string = wrapper.find('div[className="post-body-content body"]').text();
    expect(fictionContent).toEqual(defaultContent);
  });
});

describe('<FictionBody /> - with mount', () => {
  let wrapper;
  let fictionBody: FictionBodyProps;

  beforeEach(() => {
    window.getSelection = () => ({
      removeAllRanges: () => {}
    });
    // Create DOM to allow document.getElementById function
    const div = document.createElement('div');
    window.domNode = div;
    // $FlowFixMe because document.body may be null
    document.body.appendChild(div);
    fictionBody = { ...defaultFictionBody, content: '' };
    const store = mockStore(initialState);
    wrapper = mount(
      <MockedProvider store={store}>
        <FictionBody {...fictionBody} />
      </MockedProvider>,
      { attachTo: window.domNode }
    );
  });

  it('should display "no content specified" when content is set to null', () => {
    const fictionContent: string = wrapper.find('div[className="post-body-content body"]').text();
    expect(fictionContent).toEqual('no content specified');
  });
});

describe('<FictionBody /> - snapshots', () => {
  it('should match snapshot', () => {
    const store = mockStore(initialState);
    const component = renderer.create(
      <MockedProvider store={store}>
        <FictionBody {...defaultFictionBody} />
      </MockedProvider>
    );
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should match snapshot no title nor content', () => {
    const props: FictionBodyProps = {
      title: '',
      content: '',
      postId: defaultId,
      contentLocale: defaultLocale,
      lang: defaultLocale,
      extracts: defaultExtracts,
      isAuthorAccountDeleted: defaultIsAuthorAccountDeleted,
      dbId: defaultDbId,
      bodyMimeType: bodyMimeType,
      refetchPost: refetchPost,
      ideaId: defaultIdeaId,
      userCanReply: false,
      mySentiment: 'like',
      sentimentCounts: {
        disagree: 0,
        dontUnderstand: 0,
        like: 0,
        moreInfo: 0
      },
      isPhaseCompleted: false,
      screenWidth: 100
    };
    const store = mockStore(initialState);
    const component = renderer.create(
      <MockedProvider store={store}>
        <FictionBody {...props} />
      </MockedProvider>
    );
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});