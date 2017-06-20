import DebateReducer from '../../../js/app/reducers/debateReducer';

describe('Return posts state changes', () => {
  it('Should handle FETCH_DEBATE_DATA', () => {
    expect(
      DebateReducer([],{
        type: 'FETCH_DEBATE_DATA'
      }))
    .toEqual({
      debateData:null,
      debateLoading:true,
      debateError:null,
      isUnauthorized:false
    });
  });
  it('Should handle RESOLVED_FETCH_DEBATE_DATA', () => {
    expect(
      DebateReducer([],{
        type: 'RESOLVED_FETCH_DEBATE_DATA',
        debateData:{data:'data'}
      }))
    .toEqual({
      debateData:{data:'data'},
      debateLoading:false,
      debateError:null,
      isUnauthorized:false
    });
  });
  it('Should handle FAILED_FETCH_DEBATE_DATA', () => {
    expect(
      DebateReducer([],{
        type: 'FAILED_FETCH_DEBATE_DATA',
        debateError:'Forbidden'
      }))
    .toEqual({
      debateData:null,
      debateLoading:false,
      debateError:'Forbidden',
      isUnauthorized:false
    });
  });
});