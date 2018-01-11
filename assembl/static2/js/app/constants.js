// @flow
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

export const APOLLO_NETWORK_STATUS = {
  /**
   * The query has never been run before and the query is now currently running. A query will still
   * have this network status even if a partial data result was returned from the cache, but a
   * query was dispatched anyway.
   */
  loading: 1,

  /**
   * If `setVariables` was called and a query was fired because of that then the network status
   * will be `setVariables` until the result of that query comes back.
   */
  setVariables: 2,

  /**
   * Indicates that `fetchMore` was called on this query and that the query created is currently in
   * flight.
   */
  fetchMore: 3,

  /**
   * Similar to the `setVariables` network status. It means that `refetch` was called on a query
   * and the refetch request is currently in flight.
   */
  refetch: 4,

  /**
   * No request is in flight for this query, and no errors happened. Everything is OK.
   */
  ready: 7
};

// Those states lists need to be kept in sync with models/post.py
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

export const CountablePublicationStates = {};
CountablePublicationStates[PublicationStates.SUBMITTED_IN_EDIT_GRACE_PERIOD] = PublicationStates.SUBMITTED_IN_EDIT_GRACE_PERIOD;
CountablePublicationStates[PublicationStates.PUBLISHED] = PublicationStates.PUBLISHED;
CountablePublicationStates[PublicationStates.MODERATED_TEXT_ON_DEMAND] = PublicationStates.MODERATED_TEXT_ON_DEMAND;
CountablePublicationStates[PublicationStates.MODERATED_TEXT_NEVER_AVAILABLE] = PublicationStates.MODERATED_TEXT_NEVER_AVAILABLE;