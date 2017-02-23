import IdeasReducer from '../../../js/app/reducers/ideasReducer';

describe('Return ideas state changes', () => {
  it('Should handle FETCH_IDEAS', () => {
    expect(
      IdeasReducer([],{
        type: 'FETCH_IDEAS'
      }))
    .toEqual({
      ideas:null,
      ideasLoading:true,
      ideasError:null
    });
  });
  it('Should handle RESOLVED_FETCH_IDEAS', () => {
    expect(
      IdeasReducer([],{
        type: 'RESOLVED_FETCH_IDEAS',
        ideas:{data:'data'}
      }))
    .toEqual({
      ideas:{data:'data'},
      ideasLoading:false,
      ideasError:null
    });
  });
  it('Should handle FAILED_FETCH_IDEAS', () => {
    expect(
      IdeasReducer([],{
        type: 'FAILED_FETCH_IDEAS',
        ideasError:'Forbidden'
      }))
    .toEqual({
      ideas:null,
      ideasLoading:false,
      ideasError:'Forbidden'
    });
  });
});