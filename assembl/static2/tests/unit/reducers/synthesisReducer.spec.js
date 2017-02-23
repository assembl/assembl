import SynthesisReducer from '../../../js/app/reducers/synthesisReducer';

describe('Return synthesis state changes', () => {
  it('Should handle FETCH_SYNTHESIS', () => {
    expect(
      SynthesisReducer([],{
        type: 'FETCH_SYNTHESIS'
      }))
    .toEqual({
      synthesis:null,
      synthesisLoading:true,
      synthesisError:null
    });
  });
  it('Should handle RESOLVED_FETCH_SYNTHESIS', () => {
    expect(
      SynthesisReducer([],{
        type: 'RESOLVED_FETCH_SYNTHESIS',
        synthesis:{data:'data'}
      }))
    .toEqual({
      synthesis:{data:'data'},
      synthesisLoading:false,
      synthesisError:null
    });
  });
  it('Should handle FAILED_FETCH_SYNTHESIS', () => {
    expect(
      SynthesisReducer([],{
        type: 'FAILED_FETCH_SYNTHESIS',
        synthesisError:'Forbidden'
      }))
    .toEqual({
      synthesis:null,
      synthesisLoading:false,
      synthesisError:'Forbidden'
    });
  });
});