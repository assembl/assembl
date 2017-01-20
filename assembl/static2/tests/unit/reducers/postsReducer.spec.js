import PostsReducer from '../../../js/app/reducers/postsReducer';

describe('Return posts state changes', () => {
  it('Should handle FETCH_POSTS', () => {
    expect(
      PostsReducer([],{
        type: 'FETCH_POSTS'
      }))
    .toEqual({
      posts:null,
      postsLoading:true,
      postsError:null
    });
  });
  it('Should handle RESOLVED_FETCH_POSTS', () => {
    expect(
      PostsReducer([],{
        type: 'RESOLVED_FETCH_POSTS',
        posts:{data:'data'}
      }))
    .toEqual({
      posts:{data:'data'},
      postsLoading:false,
      postsError:null
    });
  });
  it('Should handle FAILED_FETCH_POSTS', () => {
    expect(
      PostsReducer([],{
        type: 'FAILED_FETCH_POSTS',
        postsError:'Forbidden'
      }))
    .toEqual({
      posts:null,
      postsLoading:false,
      postsError:'Forbidden'
    });
  });
});