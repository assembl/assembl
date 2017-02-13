import HttpRequestHandler from '../utils/httpRequestHandler';

class PartnersService {
  static fetchPartners(debateId) {
    const fetchUrl = `/data/Discussion/${debateId}/partner_organizations`;
    return HttpRequestHandler.request({ method: 'GET', url: fetchUrl }).then((partners) => {
      return partners;
    });
  }
}

export default PartnersService;