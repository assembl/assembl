import React from 'react';

const SectionTitle = ({ i18n, tabId, annotation }) => {
  const { locale, translations } = i18n;
  return (
    <div>
      <h3 className="dark-title-3">
        {translations[locale].administration.survey[tabId]}
      </h3>
      <div className="box-hyphen" />
      <div className="annotation">
        {annotation}
      </div>
    </div>
  );
};

export default SectionTitle;