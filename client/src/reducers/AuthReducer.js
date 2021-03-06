import { Map, fromJS } from 'immutable';

import * as actionTypes from '../constants';
import fieldsValidationReducer from './FieldsValidationReducer';
import { getAuthToken } from '../utils';

export const INITIAL_AUTH_STATE = Map({
  isAuthenticated: !!getAuthToken(),
  isFetching: false,
  credentials: Map({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  }),
  error: null,
  user: null,
  isShowingLogin: true,
  validations: Map({
    isValid: false
  })
});

export default function (state = INITIAL_AUTH_STATE, action) {
  switch (action.type) {
    case actionTypes.LOGIN_REQUEST:
    case actionTypes.SIGNUP_REQUEST:
      return state.merge(Map({
        isFetching: true,
        credentials: fromJS(action.credentials)
      }));

    case actionTypes.LOGIN_SUCCESS:
    case actionTypes.SIGNUP_SUCCESS:
      return state.merge(Map({
        isAuthenticated: true,
        isFetching: false,
        credentials: Map({
          username: '',
          email: '',
          password: '',
          confirmPassword: ''
        }),
        error: null,
        user: fromJS(action.user)
      }));

    case actionTypes.LOGIN_FAILURE:
    case actionTypes.SIGNUP_FAILURE:
      return state.merge(Map({
        isAuthenticated: false,
        isFetching: false,
        error: fromJS(action.error),
        user: null
      }));

    case actionTypes.LOGOUT_REQUEST:
      return INITIAL_AUTH_STATE.merge({
        isAuthenticated: false
      });

    case actionTypes.CREDENTIALS_UPDATE:
      return state.merge(Map({
        credentials: fromJS(action.credentials)
      }));

    case actionTypes.TOGGLE_LOGIN_VIEW:
      return state.merge(Map({
        isShowingLogin: !state.get('isShowingLogin'),
        error: null,
        validations: Map({
          isValid: false
        })
      }));

    /**
     * Validate input fields entered by the user.
     * In this instance, modify the behaviour of the validator based on the
     * fact that we're validating auth fields.
     */
    case actionTypes.VALIDATE_AUTH_FIELD:
      return state.merge(fieldsValidationReducer(state, {
        type: action.field,
        target: 'credentials',
        currentView: 'auth'
      }));

    case actionTypes.FETCH_USER_DETAILS_SUCCESS:
      return state.merge(Map({
        user: action.user // BUG: This should be fromJS(action.user)
      }));

    case actionTypes.USER_DETAILS_UPDATE_SUCCESS: {
      const user = state.get('user');
      if (user._id === action.user._id) {
        return state.mergeDeep(Map({
          user: action.user // Propagated BUG: Should be fromJS(action.user)
        }));
      }
      return state;
    }

    default:
      return state;
  }
}
