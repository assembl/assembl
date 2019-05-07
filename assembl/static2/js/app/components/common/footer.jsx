// @flow
import React from 'react';
import { Link } from 'react-router';
import { Translate } from 'react-redux-i18n';
import { Grid } from 'react-bootstrap';
import { connect } from 'react-redux';
import { graphql, compose } from 'react-apollo';
import connectedUserIsAdmin from '../../utils/permissions';
import { get } from '../../utils/routeMap';
import manageErrorAndLoading from '../../components/common/manageErrorAndLoading';
import TabsConditionQuery from '../../graphql/TabsConditionQuery.graphql';

type Props = {
  assemblVersion: string,
  slug: string,
  hasLegalNotice: boolean,
  hasTermsAndConditions: boolean,
  hasPrivacyPolicy: boolean,
  hasUserGuidelines: boolean,
  lang: string,
  socialMedias: Array<SocialMedia>,
  footerLinks: Array<Object>
};

const Footer = ({
  assemblVersion,
  slug,
  socialMedias,
  footerLinks,
  hasLegalNotice,
  hasTermsAndConditions,
  hasPrivacyPolicy,
  hasUserGuidelines,
  lang
}: Props) => {
  const debateSlug = { slug: slug };
  const legalPages = {
    terms: hasTermsAndConditions,
    legalNotice: hasLegalNotice,
    cookiesPolicy: true,
    privacyPolicy: hasPrivacyPolicy,
    userGuidelines: hasUserGuidelines
  };
  const legalPagesInFooter = Object.keys(legalPages).map(
    key =>
      (legalPages[key] ? (
        <Link to={`${get(key, debateSlug)}`} key={key}>
          <Translate value={`footer.${key}`} />
        </Link>
      ) : null)
  );
  return (
    <Grid fluid className="background-dark relative" id="footer">
      <div className="max-container">
        <div className={socialMedias ? 'footer' : 'footer margin-l'}>
          {socialMedias && (
            <div>
              <p>
                <Translate value="footer.socialMedias" />
              </p>
              <ul className="social-medias">
                {socialMedias.map((sMedia, index) => (
                  <li className={`media-${index}`} key={sMedia.name}>
                    <Link to={sMedia.url} target="_blank">
                      <i className={`assembl-icon-${sMedia.name}-circle`} />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {footerLinks && (
            <div className="custom-links">
              {footerLinks.map((footerLink, index) => (
                <div className="inline margin-m" key={`fl-${index}`}>
                  <Link to={footerLink.url} target="_blank">
                    {footerLink.titleEntries[lang]}
                  </Link>
                </div>
              ))}
            </div>
          )}
          <div className="footer-links">
            <div className="copyright">
              ©{' '}
              <Link to="https://bluenove.com/offres/assembl/" target="_blank">
                Assembl
              </Link>{' '}
              powered by{' '}
              <Link to="http://bluenove.com/" target="_blank">
                bluenove
              </Link>
            </div>
            <div />
            <div className="legal-pages">{legalPagesInFooter}</div>
            {connectedUserIsAdmin() && assemblVersion && <div className="assembl-version">v{assemblVersion}</div>}
          </div>
        </div>
      </div>
    </Grid>
  );
};

const mapStateToProps = state => ({
  assemblVersion: state.context.assemblVersion,
  socialMedias: state.debate.debateData.socialMedias,
  footerLinks: state.debate.debateData.footerLinks,
  slug: state.debate.debateData.slug,
  lang: state.i18n.locale
});
const withData = graphql(TabsConditionQuery, {
  props: ({ data: { hasPrivacyPolicy, hasLegalNotice, hasCookiesPolicy, hasTermsAndConditions, hasUserGuidelines } }) => ({
    hasPrivacyPolicy: hasPrivacyPolicy,
    hasLegalNotice: hasLegalNotice,
    hasCookiesPolicy: hasCookiesPolicy,
    hasTermsAndConditions: hasTermsAndConditions,
    hasUserGuidelines: hasUserGuidelines
  })
});

export default compose(connect(mapStateToProps), withData, manageErrorAndLoading({ displayLoader: false }))(Footer);