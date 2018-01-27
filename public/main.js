'use strict';

/**
 * @return {!Object} The FirebaseUI config.
 */
function getUiConfig() {
  return {
    'callbacks': {
      // Called when the user has been successfully signed in.
      'signInSuccess': function(user, credential, redirectUrl) {
        handleSignedInUser(user);
        // Do not redirect.
        return false;
      }
    },
    // Opens IDP Providers sign-in flow in a popup.
    'signInFlow': 'popup',
    'signInOptions': [
      {
        provider: firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        // Required to enable this provider in One-Tap Sign-up.
        authMethod: 'https://accounts.google.com',
        // Required to enable ID token credentials for this provider.
        clientId: CLIENT_ID
      }
    ],
    // Terms of service url.
    'tosUrl': 'https://www.google.com',
    'credentialHelper': CLIENT_ID && CLIENT_ID != 'YOUR_OAUTH_CLIENT_ID' ?
        firebaseui.auth.CredentialHelper.GOOGLE_YOLO :
        firebaseui.auth.CredentialHelper.ACCOUNT_CHOOSER_COM
  };
}

// Initialize the FirebaseUI Widget using Firebase.
var ui = new firebaseui.auth.AuthUI(firebase.auth());
// Disable auto-sign in.
ui.disableAutoSignIn();


/**
 * @return {string} The URL of the FirebaseUI standalone widget.
 */
function getWidgetUrl() {
  return '/widget#recaptcha=' + getRecaptchaMode();
};


/**
 * @return {string} The reCAPTCHA rendering mode from the configuration.
 */
function getRecaptchaMode() {
  // Quick way of checking query params in the fragment. If we add more config
  // we might want to actually parse the fragment as a query string.
  return location.hash.indexOf('recaptcha=invisible') !== -1 ?
      'invisible' : 'normal';
};


/**
 * Open a popup with the FirebaseUI widget.
 */
var signIn = function() {
  window.open(getWidgetUrl(), 'Sign In', 'width=985,height=735');
};


/**
 * Displays the UI for a signed in user.
 * @param {!firebase.User} user
 */
var handleSignedInUser = function(user) {
  document.getElementById('user-signed-in').style.display = 'block';
  document.getElementById('user-signed-out').style.display = 'none';
  document.getElementById('name').textContent = user.displayName;
  document.getElementById('email').textContent = user.email;
  document.getElementById('uid').textContent = user.uid;
  if (user.photoURL){
    document.getElementById('photo').src = user.photoURL;
    document.getElementById('photo').style.display = 'block';
  } else {
    document.getElementById('photo').style.display = 'none';
  }

  // When a user signs in, save their user info to RTDB and Firestore,
  // to demo wipeout and takeout functionality.
  var data = {
    name: user.displayName,
    email: user.email,
    photo: user.photoURL,
    color: "blue"
  };

  firebase.storage().ref()
    .child(`sample_data_for_${user.uid}.json`)
    .putString(`{photo: ${user.photoURL}}`);
  firebase.database().ref('users/' + user.uid).set(data);
  firebase.firestore().collection('users').doc(user.uid).set(data);
  firebase.firestore().collection('admins').doc(user.uid).set(data);
};

const uploadToStorage = (uid, takeout) => {
  var json = JSON.stringify(takeout);
  var bucket = storage.bucket(bucketName);
  var file = bucket.file(`${uid}.json`);

  return file.save(json);
};


/**
 * Displays the UI for a signed out user.
 */
var handleSignedOutUser = function() {
  document.getElementById('user-signed-in').style.display = 'none';
  document.getElementById('user-signed-out').style.display = 'block';
  ui.start('#firebaseui-container', getUiConfig());
};

// Listen to change in auth state so it displays the correct UI for when
// the user is signed in or not.
firebase.auth().onAuthStateChanged(function(user) {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('loaded').style.display = 'block';
  user ? handleSignedInUser(user) : handleSignedOutUser();
});

/**
 * Deletes the user's account.
 */
var deleteAccount = function(firebaseStorage) {
  firebase.auth().currentUser.delete();
};

var takeout = function() {
  var xhr = new XMLHttpRequest();
  xhr.open('POST', '/takeout', true);
  xhr.send(JSON.stringify(firebase.auth().currentUser));
};

/**
 * Initializes the app.
 */
var initApp = function() {
  document.getElementById('sign-in').addEventListener(
      'click', signIn);
  document.getElementById('sign-out').addEventListener(
    'click', function() {
      firebase.auth().signOut();
    }
  );
  document.getElementById('delete-account').addEventListener(
    'click', function() {
      deleteAccount();
    }
  );
  document.getElementById('takeout').addEventListener(
    'click', function() {
      takeout();
    }
  );
};

window.addEventListener('load', initApp);
