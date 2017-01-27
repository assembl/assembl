import HttpRequestHandler from '../utils/httpRequestHandler';

class PartnersService {
  static fetchPartners(discussionId) {
    const fetchUrl = `/data/Discussion/${discussionId}/partner_organizations`;
    return HttpRequestHandler.request({ method: 'GET', url: fetchUrl }).then((partners) => {
      return partners;
    });
  }
}

export default PartnersService;