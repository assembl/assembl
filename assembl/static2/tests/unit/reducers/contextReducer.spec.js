import ContextReducer from '../../../js/app/reducers/contextReducer';

describe('Return context state changes', () => {
  it('Should handle ADD_CONTEXT', () => {
    expect(
      ContextReducer([], {
        type: 'ADD_CONTEXT',
        rootPath: undefined,
        debateId: '7',
        connectedUserId: '1403'
      })
    ).toEqual({
      rootPath: undefined,
      debateId: '7',
      connectedUserId: '1403',
      connectedUserIdBase64: 'QWdlbnRQcm9maWxlOjE0MDM='
    });
  });
});