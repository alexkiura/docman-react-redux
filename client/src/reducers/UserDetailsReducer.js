import { Map, fromJS } from 'immutable';

import * as actionTypes from '../constants';
import fieldsValidationReducer from './FieldsValidationReducer';

export const INITIAL_USER_DETAILS_STATE = Map({
  isFetching: false,
  isShowingUpdate: false,
  user: null,
  updatedUser: Map(),
  fetchError: null,
  validations: Map({
    isValid: false
  })
});

export default function (state = INITIAL_USER_DETAILS_STATE, action) {
  switch (action.type) {
    case actionTypes.FETCH_USER_DETAILS_REQUEST:
      return state.merge(Map({
        isFetching: true
      }));

    case actionTypes.FETCH_USER_DETAILS_SUCCESS:
      return state.merge(Map({
        isFetching: false,
        user: fromJS(action.user)
      }));

    case actionTypes.FETCH_USER_DETAILS_ERROR:
      if (action.authError) {
        return state.merge(INITIAL_USER_DETAILS_STATE);
      }
      return state.merge({
        isFetching: false,
        fetchError: fromJS(action.error)
      });

    case actionTypes.USER_DETAILS_UPDATE_REQUEST:
      return state.merge(Map({
        isFetching: true,
        updatedUser: fromJS(action.updatedUser)
      }));

    case actionTypes.USER_DETAILS_UPDATE_SUCCESS:
      return state.merge(Map({
        isFetching: false,
        isShowingUpdate: false,
        updatedUser: fromJS(action.user),
        user: fromJS(action.user)
      }));

    case actionTypes.USER_DETAILS_UPDATE_FAILURE:
      return state.merge(Map({
        isFetching: false,
        userUpdateError: fromJS(action.error)
      }));

    case actionTypes.LOGOUT_REQUEST:
      return INITIAL_USER_DETAILS_STATE;

    /**
     * Toggle between showing the user profile and updating it.
     */
    case actionTypes.TOGGLE_SHOW_USER_UPDATE_VIEW:
      return state.merge(Map({
        isShowingUpdate: !state.get('isShowingUpdate'),
        userUpdateError: null,
        validations: Map({
          isValid: false
        })
      }));

    case actionTypes.USER_DETAILS_FIELD_UPDATE:
      return state.merge(Map({
        updatedUser: fromJS(action.updatedUser)
      }));

    /**
     * Validate the fields entered by the user when they're updating the
     * user profile.
     * Modify the behaviour of the FieldsValidationReducer based on the fact
     * that we're validating user details fields.
     */
    case actionTypes.VALIDATE_USER_DETAILS_FIELD:
      return state.merge(fieldsValidationReducer(state, {
        type: action.field,
        target: 'updatedUser',
        currentView: 'userDetails'
      }));

    case actionTypes.ANOTHER_USER_PROFILE_UPDATE_SUCCESS:
      return state.merge(Map({
        isShowingUpdate: !state.get('isShowingUpdate')
      }));

    default:
      return state;
  }
}
