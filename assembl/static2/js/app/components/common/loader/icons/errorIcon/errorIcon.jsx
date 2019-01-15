// @flow
import React from 'react';
// Helper imports
import { I18n } from 'react-redux-i18n';
import { getIconPath } from '../../../../../utils/globalFunctions';

const LoadingIcon = () => <img src={getIconPath('error-icon.svg')} alt={I18n.t('common.icons.error')} className="icon" />;

export default LoadingIcon;