import SynthesisReducer from '../../../js/app/reducers/synthesisReducer';

describe('Return synthesis state changes', () => {
  it('Should handle FETCH_SYNTHESIS', () => {
    expect(
      SynthesisReducer([], {
        type: 'FETCH_SYNTHESIS'
      })
    ).toEqual({
      lastPublishedSynthesis: null,
      loading: true,
      error: null
    });
  });
  it('Should handle RESOLVED_FETCH_SYNTHESIS', () => {
    const lastPublishedSynthesis = {
      creation_date: 'thedate',
      introduction: 'Lorem ipsum dolor sit amet',
      published_in_post: 'post/foobar',
      subject: 'The subject'
    };
    expect(
      SynthesisReducer([], {
        type: 'RESOLVED_FETCH_SYNTHESIS',
        synthesis: { lastPublishedSynthesis: lastPublishedSynthesis }
      })
    ).toEqual({
      lastPublishedSynthesis: {
        creationDate: 'thedate',
        introduction: 'Lorem ipsum dolor sit amet',
        publishedInPost: 'post/foobar',
        subject: 'The subject'
      },
      loading: false,
      error: null
    });
  });
  it('Should handle FAILED_FETCH_SYNTHESIS', () => {
    expect(
      SynthesisReducer([], {
        type: 'FAILED_FETCH_SYNTHESIS',
        synthesisError: 'Forbidden'
      })
    ).toEqual({
      lastPublishedSynthesis: null,
      loading: false,
      error: 'Forbidden'
    });
  });
});