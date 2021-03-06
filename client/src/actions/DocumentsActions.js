/**
 * Document related actions.
 * Includes actions for fetching, updating and deleting documents.
 */
import Axios from 'axios';

import * as actionTypes from '../constants';
import { showSnackBarMessage } from './UtilityActions';
import { getAuthToken } from '../utils';

/**
 * Document fetching actions
 */
export function fetchDocumentsRequest() {
  return {
    type: actionTypes.FETCH_DOCUMENTS_REQUEST
  };
}

export function fetchDocumentsSuccess(documentsResponse) {
  return {
    type: actionTypes.FETCH_DOCUMENTS_SUCCESS,
    documents: documentsResponse.data
  };
}

export function fetchDocumentsFailure(error) {
  return {
    type: actionTypes.FETCH_DOCUMENTS_FAILURE,
    error: error.data || { message: error.message }
  };
}

/**
 * Fetch documents from the server asynchronously.
 */
export function fetchDocumentsFromServer(authToken = getAuthToken()) {
  return (dispatch) => {
    dispatch(fetchDocumentsRequest());

    return Axios
      .get('/api/documents', {
        headers: { 'x-access-token': authToken }
      })
      .then((documents) => {
        dispatch(fetchDocumentsSuccess(documents));
      })
      .catch((error) => {
        dispatch(fetchDocumentsFailure(error));
      });
  };
}

/**
 * Expand a single document.
 */
export function expandDocument(docId) {
  return {
    type: actionTypes.EXPAND_DOCUMENT,
    docId: docId || ''
  };
}

/**
 * Create a document.
 */
export function createDocumentRequest(documentContent) {
  return {
    type: actionTypes.CREATE_DOCUMENT_REQUEST,
    documentContent: {
      ...documentContent,
      optimistic: true
    }
  };
}

/**
 * Perform this action once the creation is successful.
 */
export function createDocumentSuccess(documentData) {
  return {
    type: actionTypes.CREATE_DOCUMENT_SUCCESS,
    documentContent: documentData.data,
    own: documentData.own !== undefined
      ? documentData.own
      : documentData.data.role.title === 'private' || false
  };
}

/**
 * Handle create document failure.
 */
export function createDocumentFailure(error) {
  return {
    type: actionTypes.CREATE_DOCUMENT_FAILURE,
    error: error.data || { message: error.message }
  };
}

/**
 * Perform the actual document creation by posting data to the server.
 *
 * Dispatches appropriate actions according to the current state of the
 * document creation request. When dispatching createDocumentRequest, we
 * fake the document's details so that we can perform an optimistic update
 * without breaking the application's functionality.
 */
export function createDocument(content, authToken = getAuthToken()) {
  return (dispatch, getState) => {
    // Get the authenticated user's details.
    const auth = getState().get('auth').toJS();

    // Fake and dispatch documents details to enable optimistic update
    // without breaking functionality.
    dispatch(createDocumentRequest(Object.assign({}, content, {
      owner: auth.user,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      _id: Math.floor(Math.random() * 1000000).toString(32)
    })));

    return Axios
      .post('/api/documents', content, {
        headers: { 'x-access-token': authToken }
      })
      .then((documentData) => {
        // Dispatch only if we've created a private document. The other types
        // of documents should be handled by the actions dispatched after
        // receiving data in the websockets.
        if (documentData.data.role.title === 'private') {
          dispatch(createDocumentSuccess(documentData));
        }
        dispatch(showSnackBarMessage('Successfully created document.'));
      })
      .catch((error) => {
        dispatch(createDocumentFailure(error));
        dispatch(showSnackBarMessage('Uh oh! An error occurred.'));
      });
  };
}

/**
 * Show or hide the new document modal.
 */
export function toggleCreateModal() {
  return {
    type: actionTypes.TOGGLE_CREATE_MODAL
  };
}

/**
 * Update the content (in the state) of the document being created.
 */
export function updateNewDocumentContents(documentContent) {
  return {
    type: actionTypes.UPDATE_NEW_DOCUMENT_CONTENTS,
    documentContent
  };
}

export function validateDocumentContents(field) {
  return (dispatch, getState) => {
    const documentCrudOptions = getState()
      .getIn(['docs', 'documents', 'documentCrudOptions'])
      .toJS();

    return dispatch({
      type: actionTypes.VALIDATE_NEW_DOCUMENT_CONTENTS,
      field,
      documentCrudOptions
    });
  };
}

/**
 * Update a document's details.
 *
 * Only dispatch documentUpdateSuccess for private documents. Other documents
 * updates will be dispatched using websockets.
 */
export function requestDocumentUpdate(doc) {
  return {
    type: actionTypes.DOCUMENT_UPDATE_REQUEST,
    document: doc
  };
}

export function documentUpdateSuccess(documentData) {
  return {
    type: actionTypes.DOCUMENT_UPDATE_SUCCESS,
    document: documentData.data
  };
}

export function documentUpdateFailure(error) {
  return {
    type: actionTypes.DOCUMENT_UPDATE_FAILURE,
    error: error.data || { message: error.message }
  };
}

/**
 * If the role of a document we already have in the state changes, determine
 * whether we still have access to it and update state accordingly.
 */
export function documentRoleUpdate(documentData) {
  return (dispatch, getState) => {
    const user = getState().getIn(['auth', 'user']);
    const doc = documentData.data;
    const allowAccess = (
      doc.role.title === 'private' && user.username === doc.owner.username ||
      doc.role.title === 'admin' && user.username === doc.owner.username ||
      user.role.title === 'admin' ||
      doc.role.title === 'user' ||
      doc.role.title === 'public'
    );

    return dispatch({
      type: actionTypes.DOCUMENT_ROLE_UPDATE,
      document: doc,
      allowAccess
    });
  };
}

export function updateDocument(doc, authToken = getAuthToken()) {
  return (dispatch) => {
    dispatch(requestDocumentUpdate(doc));

    return Axios
      .put(`/api/documents/${doc._id}`, doc, {
        headers: { 'x-access-token': authToken }
      })
      .then((updatedDoc) => {
        if (updatedDoc.data.role.title === 'private') {
          dispatch(documentUpdateSuccess(updatedDoc));
        }
        dispatch(showSnackBarMessage('Successfully updated document.'));
      })
      .catch((error) => {
        dispatch(documentUpdateFailure(error));
        dispatch(showSnackBarMessage('Error while updating document.'));
      });
  };
}

/**
 * Show the update document view with the given doc.
 *
 * Given this is a toggle function, we handle case where we're hiding the
 * document update view, in which we won't have a document passed to us.
 */
export function toggleDocumentUpdate(doc) {
  return (dispatch, getState) => {
    let documentObject = doc;
    if (!documentObject) {
      documentObject = getState()
        .getIn(['docs', 'documentCrudOptions', 'documentContent'])
        .toJS();

      documentObject = {
        ...documentObject,
        isUpdatingDocument: false // No doc passed, had to construct one. Flag this as a non-update.
      };
    } else {
      documentObject = {
        ...documentObject,
        isUpdatingDocument: true
      };
    }

    // Decompose the role to just it's title.
    documentObject = Object.assign({}, documentObject, {
      role: documentObject.role.title
    });

    return dispatch({
      type: actionTypes.TOGGLE_SHOW_DOCUMENT_UPDATE,
      document: documentObject
    });
  };
}

export function documentDeleteRequest(deletedDocument) {
  return {
    type: actionTypes.DELETE_DOCUMENT_REQUEST,
    deletedDocument
  };
}

export function documentDeleteSuccess(docId) {
  return {
    type: actionTypes.DELETE_DOCUMENT_SUCCESS,
    docId
  };
}

export function deleteDocumentFailure(error, deletedDocument) {
  return {
    type: actionTypes.DELETE_DOCUMENT_FAILURE,
    error: error.data || { message: error.message },
    deletedDocument
  };
}

export function deleteDocument(docId, authToken = getAuthToken()) {
  return (dispatch, getState) => {
    let deletedDocument;
    getState().getIn(['docs', 'documents']).map((doc, index) => {
      if (doc.get('_id') === docId) {
        deletedDocument = {
          index,
          item: doc.toJS()
        };
      }

      return doc;
    });
    dispatch(documentDeleteRequest(deletedDocument));

    return Axios
      .delete(`/api/documents/${docId}`, {
        headers: { 'x-access-token': authToken }
      })
      .then(() => {
        dispatch(showSnackBarMessage('Document deleted successfully.'));
      })
      .catch((error) => {
        dispatch(deleteDocumentFailure(error, deletedDocument));
        dispatch(showSnackBarMessage(
          'An error occurred while deleting document.'));
      });
  };
}

export function changeDocumentsFilter(filter) {
  return {
    type: actionTypes.CHANGE_DOCUMENTS_FILTER,
    filter
  };
}
