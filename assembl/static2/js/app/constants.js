export const EXTRA_SMALL_SCREEN_WIDTH = 600;
export const SMALL_SCREEN_WIDTH = 768;
export const MEDIUM_SCREEN_WIDTH = 992;
export const APP_CONTAINER_MAX_WIDTH = 1400;
export const IDEA_PREVIEW_MAX_WIDTH = 350;
export const IDEA_PREVIEW_MIN_WIDTH = 280;
// export const IDEA_PREVIEW_MIN_WIDTH = 280;
export const NB_IDEA_PREVIEW_TO_SHOW = 4;
export const APP_CONTAINER_PADDING = 15;
export const MIN_WIDTH_COLUMN = 400;
export const COLUMN_OPACITY_GAIN = 0.5;

export const PublicationStates = {
  DRAFT: 'DRAFT',
  SUBMITTED_IN_EDIT_GRACE_PERIOD: 'SUBMITTED_IN_EDIT_GRACE_PERIOD',
  PUBLISHED: 'PUBLISHED',
  MODERATED_TEXT_ON_DEMAND: 'MODERATED_TEXT_ON_DEMAND',
  MODERATED_TEXT_NEVER_AVAILABLE: 'MODERATED_TEXT_NEVER_AVAILABLE',
  DELETED_BY_USER: 'DELETED_BY_USER',
  DELETED_BY_ADMIN: 'DELETED_BY_ADMIN'
};

export const BlockingPublicationStates = {};
BlockingPublicationStates[PublicationStates.MODERATED_TEXT_NEVER_AVAILABLE] = PublicationStates.MODERATED_TEXT_NEVER_AVAILABLE;
BlockingPublicationStates[PublicationStates.DELETED_BY_USER] = PublicationStates.DELETED_BY_USER;
BlockingPublicationStates[PublicationStates.DELETED_BY_ADMIN] = PublicationStates.DELETED_BY_ADMIN;

export const ModeratedPublicationStates = {};
ModeratedPublicationStates[PublicationStates.MODERATED_TEXT_NEVER_AVAILABLE] = PublicationStates.MODERATED_TEXT_NEVER_AVAILABLE;
ModeratedPublicationStates[PublicationStates.MODERATED_TEXT_ON_DEMAND] = PublicationStates.MODERATED_TEXT_ON_DEMAND;

export const DeletedPublicationStates = {};
DeletedPublicationStates[PublicationStates.DELETED_BY_USER] = PublicationStates.DELETED_BY_USER;
DeletedPublicationStates[PublicationStates.DELETED_BY_ADMIN] = PublicationStates.DELETED_BY_ADMIN;