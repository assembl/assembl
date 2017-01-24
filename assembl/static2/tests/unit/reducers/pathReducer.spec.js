import PathReducer from '../../../js/app/reducers/pathReducer';

describe('Return root path of the router\'s app', () => {
  it('Should handle ADD_PATH', () => {
    expect(
      PathReducer([],{
        type: 'ADD_PATH',
        rootPath: '/v2/'
      }))
    .toEqual({
      rootPath: '/v2/'
    });
  });
});