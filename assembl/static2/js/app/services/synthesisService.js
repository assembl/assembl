import { xmlHttpRequest } from '../utils/httpRequestHandler';
import { getSortedArrayByKey } from '../utils/globalFunctions';

const getSynthesisByStatus = (synthesis) => {
  const publishedSynthesis = [];
  const draftSynthesis = [];
  let lastPublishedSynthesis = {};
  const sortedSynthesis = getSortedArrayByKey(synthesis, 'creation_date').reverse();
  sortedSynthesis.forEach((item, index) => {
    if (!item.is_next_synthesis) publishedSynthesis.push(item);
    else draftSynthesis.push(item);
    if (index < 1) lastPublishedSynthesis = item;
  });
  return [publishedSynthesis, draftSynthesis, lastPublishedSynthesis];
};

export const buildSynthesis = (synthesis) => {
  const allSynthesis = getSynthesisByStatus(synthesis);
  return {
    publishedSynthesis: allSynthesis[0],
    draftSynthesis: allSynthesis[1],
    lastPublishedSynthesis: allSynthesis[2]
  };
};

export const getSynthesis = (debateId) => {
  const fetchUrl = `/api/v1/discussion/${debateId}/explicit_subgraphs/synthesis`;
  return xmlHttpRequest({ method: 'GET', url: fetchUrl }).then((synthesis) => {
    return buildSynthesis(synthesis);
  });
};