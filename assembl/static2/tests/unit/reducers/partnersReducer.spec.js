import UsersReducer from '../../../js/app/reducers/partnersReducer';

describe('Return posts state changes', () => {
  it('Should handle FETCH_PARTNERS', () => {
    expect(
      UsersReducer([],{
        type: 'FETCH_PARTNERS'
      }))
    .toEqual({
      partners:null,
      partnersLoading:true,
      partnersError:null
    });
  });
  it('Should handle RESOLVED_FETCH_PARTNERS', () => {
    expect(
      UsersReducer([],{
        type: 'RESOLVED_FETCH_PARTNERS',
        partners:{data:'data'}
      }))
    .toEqual({
      partners:{data:'data'},
      partnersLoading:false,
      partnersError:null
    });
  });
  it('Should handle FAILED_FETCH_PARTNERS', () => {
    expect(
      UsersReducer([],{
        type: 'FAILED_FETCH_PARTNERS',
        partnersError:'Forbidden'
      }))
    .toEqual({
      partners:null,
      partnersLoading:false,
      partnersError:'Forbidden'
    });
  });
});