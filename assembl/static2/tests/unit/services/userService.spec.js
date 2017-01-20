import UserService from '../../../js/app/services/userService';

const mockApi = [
  {
    "@id":"local:AgentProfile/12",
    "@type":"User",
    "@view":null,
    "accounts":[],
    "avatar_url_base":"/user/id/12/avatar/",
    "name":"Late participant",
    "real_name":"Late participant"
  },
  {
    "@id":"local:AgentProfile/11",
    "@type":"User",
    "@view":null,
    "accounts":[],
    "avatar_url_base":"/user/id/11/avatar/",
    "name":"Québeccity talk radio",
    "post_count":2,
    "real_name":"Québeccity talk radio",
    verified:true
  },
  {
    "@id":"local:AgentProfile/767",
    "@type":"User",
    "@view":null,
    "accounts":[],
    "avatar_url_base":"/user/id/11/avatar/",
    "name":"Aryan Yazdani",
    "post_count":5,
    "real_name":"Aryan Yazdani",
    verified:true
  },
  {
    "@id":"local:AgentProfile/222",
    "@type":"User",
    "@view":null,
    "accounts":[],
    "avatar_url_base":"/user/id/11/avatar/",
    "name":"Pauline Thomas",
    "post_count":12,
    "real_name":"Pauline Thomas",
    verified:true
  }
];

describe('This test concern user Service', () => {
  it('Should return the mock built from API response', () => {
    const expectedResult = {
      totalVerifiedUsers: 3,
      allUsers: mockApi
    };
    const result = UserService.buildUsers(mockApi);
    expect(result).toEqual(expectedResult);
  });
});