import UsersReducer from '../../../js/app/reducers/usersReducer';

describe('Return posts state changes', () => {
  it('Should handle FETCH_USERS', () => {
    expect(
      UsersReducer([],{
        type: 'FETCH_USERS'
      }))
    .toEqual({
      users:null,
      usersLoading:true,
      usersError:null
    });
  });
  it('Should handle RESOLVED_FETCH_USERS', () => {
    expect(
      UsersReducer([],{
        type: 'RESOLVED_FETCH_USERS',
        users:{data:'data'}
      }))
    .toEqual({
      users:{data:'data'},
      usersLoading:false,
      usersError:null
    });
  });
  it('Should handle FAILED_FETCH_USERS', () => {
    expect(
      UsersReducer([],{
        type: 'FAILED_FETCH_USERS',
        usersError:'Forbidden'
      }))
    .toEqual({
      users:null,
      usersLoading:false,
      usersError:'Forbidden'
    });
  });
});