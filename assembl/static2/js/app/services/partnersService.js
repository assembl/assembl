import { xmlHttpRequest } from '../utils/httpRequestHandler';

export const getPartners = (debateId) => {
  const fetchUrl = `/data/Discussion/${debateId}/partner_organizations`;
  return xmlHttpRequest({ method: 'GET', url: fetchUrl }).then(partners => partners);
};