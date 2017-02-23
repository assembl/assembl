import ContextReducer from '../../../js/app/reducers/contextReducer';

describe('Return context state changes', () => {
  it('Should handle ADD_CONTEXT', () => {
    expect(
      ContextReducer([],{
        type: 'ADD_CONTEXT',
        rootPath:{data:'data'},
        debateId:{data:'data'},
        connectedUserId:{data:'data'}
      }))
    .toEqual({
      rootPath:{data:'data'},
      debateId:{data:'data'},
      connectedUserId:{data:'data'}
    });
  });
});