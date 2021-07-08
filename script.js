var db = firebase.firestore();
var email, age, gender, uid, userApps;

firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      // User is signed in, see docs for a list of available properties
      // https://firebase.google.com/docs/reference/js/firebase.User

        document.getElementById("login_div").style.display = "none";
        document.getElementById("display_div").style.display = "block";

        var user = firebase.auth().currentUser;
        // login event
        gtag('event', 'login', {
            method: 'Google'
        });

        if(user != null) {
            email = user.email;
            uid = user.uid;
            
            document.getElementById("welcome").innerHTML =`Welcome to App Store ${email}`;     

            var docRef = db.collection("User UID").doc(user.uid);
            // console.log(docRef.data());
            docRef.get().then((doc) => {
                if (doc.exists) {
                    // console.log("Document data:", doc.data());
                    age = doc.data().Age;
                    gender = doc.data().Gender;
                     //Check if gender and age is there
                    checkGenderAndAge();

                    userApps = doc.data().Apps;
                    //Listing all Notification
                    for(var i = doc.data().Notification.length - 1; i >= 0; i--) {
                        var message = doc.data().Notification[i];
                        displayHtml = `<li class="notificationMessage">${message}</l1>`;
                        document.getElementById(`Notify`).insertAdjacentHTML("beforeend",displayHtml);
                    }
                    // Listing user apps
                    for(var i = doc.data().Apps.length - 1; i >= 0; i--) {
                        var myApp = `<li>${doc.data().Apps[i]}</li>`;
                        document.getElementById(`yourApps`).insertAdjacentHTML("beforeend",myApp);
                    }

                } else {
                    // doc.data() will be undefined in this case
                    console.log("Document Don't exist");
                }
            }).catch((error) => {
                console.log("Error getting document:", error);
            });

            // Listing all of the apps on backend
            db.collection("Apps").get().then(querySnapshot => {
                const documents = querySnapshot.docs.map(doc => doc.data())
                // do something with documents
                for(var i = documents.length - 1; i >= 0; i--) {
                    var DeveloperID = documents[i]["Developer ID"];
                    var displayApp = `
                    <li>${documents[i].appName}: ${documents[i].Downloads} downloads</li>
                    
                    <button class="download" onclick="onDownload('${DeveloperID}', '${age}', '${gender}', '${documents[i].appName}')"> Download ↓ </button>
                    `;
                    document.getElementById(`apps`).insertAdjacentHTML("beforeend", displayApp);
                }

              });

        }

    //   var uid = user.uid;
      // ...
    } else {
      // User is signed out
      // ...
        document.getElementById("login_div").style.display = "block";
        document.getElementById("display_div").style.display = "none";

    }
  });

//login
function login() {
    var userEmail = document.getElementById("email-field").value;
    var userPass = document.getElementById("password-field").value;

    firebase.auth().signInWithEmailAndPassword(userEmail, userPass)
    .then((userCredential) => {
        // Signed in
        var user = userCredential.user;
        // ...
    })
    .catch((error) => {
        var errorCode = error.code;
        var errorMessage = error.message;
        window.alert("Error: " + errorMessage);
    });
}

// logout
function logout() {
    firebase.auth().signOut().then(() => {
        // Sign-out successful.
        document.getElementById(`Notify`).innerHTML = "";
        document.getElementById(`apps`).innerHTML = "";
        document.getElementById('yourApps').innerHTML = "";
        email = undefined;
        age = undefined;
        uid = undefined;
        userApps = undefined;
      }).catch((error) => {
        // An error happened.
      });
}

//When click on donwload button
function onDownload(DeveloperID, age, gender, appName) {

    if(!checkGenderAndAge()) {
        alert("Please fill the gender and age first");
        return;
    }

    var docRef = db.collection("User UID").doc(DeveloperID);
    var appRef =  db.collection("Apps").doc(appName);

    appRef.get().then((doc) => {
        if(doc.data()) {
            var no_of_downloads = doc.data().Downloads + 1;
            appRef.set({
                Downloads: no_of_downloads,
            }, { merge: true });
            alert("App Downloaded");
        }
        else {
            console.log("No App found");
            alert("App: No App found");
        }
    }).catch((error) => {
        console.log("Error in fetching app data");
        alert(error);
    });

    // Sending the notification 
    var newNotify;
    docRef.get().then((doc) => {
        if (doc.data()) {

            newNotify = doc.data().Notification;
            newNotify.push(`${appName} Downloaded by ${age} years old ${gender}`);

            docRef.set({
                Notification: newNotify,
            }, { merge: true });

            alert("Notification Sent to the Developer");

        } else {
            // doc.data() will be undefined in this case
            console.log("No such document!");
            alert("Notification: No such document!");
        }
    }).catch((error) => {
        console.log("Error getting document:", error);
        alert(error);
    });
}

// Adding Apps

function addApp() {
    if(!checkGenderAndAge()) {
        alert("Please fill the gender and age first");
        return;
    }
    var newAppName = document.getElementById("newAppInput").value;
    
    //Adding app in App collection
    db.collection("Apps").doc(newAppName).set({
        "Developer ID": uid,
        Downloads: 0,
        appName: newAppName,
    })
    .then(() => {
        alert("App Added Succesfully in your apps");
        console.log("Document successfully written!");
    })
    .catch((error) => {
        alert(error);
        console.error("Error writing document: ", error);
    });
    
    // Adding app in User UID collection
    userApps.push(newAppName);
    db.collection("User UID").doc(uid).set({
        Apps: userApps,
    }, {merge: true})
    .then(() => {
        alert("App Posted Succesfully");
    })
    .catch((error) => {
        alert(error);
    });

}

// SignUp new user

function signUp() {
    var newUserEmail = document.getElementById("newUserEmail").value;
    var newUserPass = document.getElementById("newUserPass").value;
    var newUserGender = document.getElementById("newUserGender").value;
    var newUserAge = document.getElementById("newUserAge").value;
    // console.log(newUserAge, newUserEmail, newUserGender, newUserPass);
    if(!((newUserGender == "Male" || newUserGender == "Female") && newUserAge > 6)) {
        alert("Please Enter the valid Gender(Male or Female) or Age!\nAge > 6");
        return;
    }

    firebase.auth().createUserWithEmailAndPassword(newUserEmail, newUserPass)
    .then((userCredential) => {
        // Signed in 
        var user = userCredential.user;
        
        db.collection("User UID").doc(user.uid).set({
            Age: newUserAge,
            Apps: [],
            Gender: newUserGender,
            Notification: [],
        })
        .then(() => {
            alert("Account Created Successfully");
            logout();
        })
        .catch((error) => {
            alert(error);
        });

        // ...
    })
    .catch((error) => {
        var errorCode = error.code;
        var errorMessage = error.message;
        console.log(error);
        // ..
    });
}

//Login with google

function googleLogin() {
    var provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth()
    .signInWithPopup(provider)
    .then((result) => {
        /** @type {firebase.auth.OAuthCredential} */
        var credential = result.credential;

        // This gives you a Google Access Token. You can use it to access the Google API.
        var token = credential.accessToken;
        // The signed-in user info.
        var user = result.user;

        var userRef = db.collection("User UID").doc(user.uid);

        userRef.get()
        .then((doc) => {
            if(!doc.exists) {
                userRef.set({
                    Age: -1,
                    Apps: [],
                    Gender: "None",
                    Notification: [],
                })
                .then(() => {
                    alert("Account Created Successfully");
                    logout();
                })
                .catch((error) => {
                    alert(error);
                });
            }
        })

        // ...
    }).catch((error) => {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        // The email of the user's account used.
        var email = error.email;
        // The firebase.auth.AuthCredential type that was used.
        var credential = error.credential;
        console.log(error);
        // ...
  });

}

//Check gender and age

function checkGenderAndAge() { //No need to pass arguments as gender and age are already global variables
    if(gender == "None" && age == -1) {
        document.getElementById("essentials").style.display = "block";
        return false;
    } else {
        document.getElementById("essentials").style.display = "none";
        return true;
    }
}

//Update gender and age

function updateGenderAndAge() {

    var genderAndAge = document.getElementById('essentials').getElementsByTagName('input');
    console.log(genderAndAge[0].value, genderAndAge[1].value);
    if((genderAndAge[0].value == `Male` || genderAndAge[0].value == `Female`) && genderAndAge[1].value > 6 ) {
        db.collection("User UID").doc(uid).set({
            Age: genderAndAge[1].value,
            Gender: genderAndAge[0].value,
        }, {merge: true})
        .then(() => {
            alert("Updated succesfully");
            window.location.reload();
        })
        .catch((error) => {
            alert(error);
        });
    } else {
        alert("Please Enter the valid Gender(Male or Female) or Age!\nAge > 6");
    }

}