import DebateService from '../../../js/app/services/debateService';

const mockApi = {
  "show_help_in_debate_section": true,
  "creator": null,
  "translation_service_class": "",
  "creation_date": "2013-12-26T18:49:26Z",
  "topic": "Jack Layton",
  "sources": [
    {
      "name": "JackLayton",
      "admin_sender": "demoassembl@coeus.ca",
      "creation_date": "2013-12-26T18:49:26Z",
      "host": "coeus.ca",
      "discussion_id": "local:Discussion/1",
      "@type": "IMAPMailbox",
      "folder": "inbox",
      "@id": "local:ContentSource/1",
      "port": 143,
      "@view": "partial"
    }
  ],
  "@view": "default",
  "@type": "Discussion",
  "widget_collection_url": "/data/Discussion/1/widgets",
  "@id": "local:Discussion/1",
  "slug": "jacklayton",
  "subscribe_to_notifications_on_signup": false,
  "permissions": {
    "add_post": [
      "r:administrator",
      "r:catcher",
      "r:moderator"
    ],
    "send_synthesis": [
      "r:administrator",
      "r:moderator"
    ],
    "edit_synthesis": [
      "r:administrator",
      "r:moderator"
    ]
  }
};

describe('This test concern debate Service', () => {
  it('Should return the mock built from API response', () => {
    const expectedResult = {
      slug: "jacklayton",
      topic: "Jack Layton",
      logo: undefined,
      introduction: undefined,
      objectives: undefined,
      help_url: undefined
    };
    const result = DebateService.buildDebateData(mockApi);
    expect(result).toEqual(expectedResult);
  });
});