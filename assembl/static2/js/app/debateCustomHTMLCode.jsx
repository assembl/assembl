// @flow
import * as React from 'react';

type Props = {
  currentRoute: string,
  debateData: DebateData
};

/*
  Some debate initiators want to embed their own tracking code.
  Note that HTML added via dangerouslySetInnerHTML does not execute <script> tags.
*/
const DebateCustomHTMLCode = ({ currentRoute, debateData }: Props) => {
  if (currentRoute && debateData) {
    let customHtml = null;
    switch (currentRoute) {
    case ':slug/home': // for backend routes "new_home" and "bare_slug"
      if (debateData && 'customHtmlCodeLandingPage' in debateData) {
        customHtml = debateData.customHtmlCodeLandingPage;
      }
      break;

    case ':slug/signup': // for backend route "contextual_react_register"
      if (debateData && 'customHtmlCodeRegistrationPage' in debateData) {
        customHtml = debateData.customHtmlCodeRegistrationPage;
      }
      break;

    default:
      break;
    }

    if (customHtml) {
      return <div className="debate-custom-html-code" dangerouslySetInnerHTML={{ __html: customHtml }} />;
    }
  }
  return <div className="debate-custom-html-code" />;
};

export default DebateCustomHTMLCode;