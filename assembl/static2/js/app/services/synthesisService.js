import HttpRequestHandler from '../utils/httpRequestHandler';
import GlobalFunctions from '../utils/globalFunctions';

class SynthesisService {
  static fetchSynthesis(debateId) {
    const that = this;
    const fetchUrl = `/api/v1/discussion/${debateId}/explicit_subgraphs/synthesis`;
    return HttpRequestHandler.request({ method: 'GET', url: fetchUrl }).then((synthesis) => {
      return that.buildSynthesis(synthesis);
    });
  }
  static buildSynthesis(synthesis) {
    const allSynthesis = this.getSynthesisByStatus(synthesis);
    return {
      publishedSynthesis: allSynthesis[0],
      draftSynthesis: allSynthesis[1],
      lastPublishedSynthesis: allSynthesis[2]
    };
  }
  static getSynthesisByStatus(synthesis) {
    const publishedSynthesis = [];
    const draftSynthesis = [];
    const sortedDate = GlobalFunctions.getSortedDate(synthesis, 'creation_date');
    const latestDate = new Date(sortedDate[sortedDate.length - 1]);
    let lastPublishedSynthesis = {};
    synthesis.forEach((item) => {
      if (!item.is_next_synthesis) publishedSynthesis.push(item);
      else draftSynthesis.push(item);
      const synthesisDate = new Date(item.creation_date);
      if (latestDate.valueOf() === synthesisDate.valueOf()) lastPublishedSynthesis = item;
    });
    return [publishedSynthesis, draftSynthesis, lastPublishedSynthesis];
  }
}

export default SynthesisService;