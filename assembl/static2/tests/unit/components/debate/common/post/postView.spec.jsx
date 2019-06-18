import React from 'react';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import ShallowRenderer from 'react-test-renderer/shallow';

import PostView from '../../../../../../js/app/components/debate/common/post/postView';
import TagOnPost from '../../../../../../js/app/components/tagOnPost/tagOnPost';
import { postProps } from './index.spec';

configure({ adapter: new Adapter() });

describe('PostView component', () => {
  it('should render a post in view mode', () => {
    const props = postProps;
    const renderer = new ShallowRenderer();
    renderer.render(<PostView {...props} />);
    const result = renderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });
});

describe('<PostView /> - with shallow', () => {
  let wrapper;
  let postViewProps;

  beforeEach(() => {
    postViewProps = { ...postProps };
    wrapper = shallow(<PostView {...postViewProps} />);
  });

  it('should render a TagOnPost component', () => {
    expect(wrapper.find(TagOnPost)).toHaveLength(1);
  });
});