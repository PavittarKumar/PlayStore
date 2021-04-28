var db = firebase.firestore();

firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      // User is signed in, see docs for a list of available properties
      // https://firebase.google.com/docs/reference/js/firebase.User

        document.getElementById("login_div").style.display = "none";
        document.getElementById("display_div").style.display = "block";

        var user = firebase.auth().currentUser;
        var name, email, age, gender;

        if(user != null) {
            email = user.email;
            name = user.displayName;
            document.getElementById("welcome").innerHTML =`Welcome ${email}`;     

            var docRef = db.collection("User UID").doc(user.uid);
            // console.log(docRef.data());
            docRef.get().then((doc) => {
                if (doc.exists) {
                    // console.log("Document data:", doc.data());
                    age = doc.data().Age;
                    gender = doc.data().Gender;
                    for(var i = doc.data().Notification.length - 1; i >= 0; i--) {
                        var message = doc.data().Notification[i];
                        displayHtml = `<li>${message}</l1>`;
                        document.getElementById(`Notify`).insertAdjacentHTML("beforeend",displayHtml);
                    }
                    for(var i = 0; i < doc.data().Apps.length; i++) {
                        var myApp = `<li>${doc.data().Apps[i]}</li>`;
                        document.getElementById(`yourApps`).insertAdjacentHTML("beforeend",myApp);
                    }

                } else {
                    // doc.data() will be undefined in this case
                    document.getElementById(`Notify`).insertAdjacentHTML("beforeend","No Notification");
                }
            }).catch((error) => {
                console.log("Error getting document:", error);
            });

            db.collection("Apps").get().then(querySnapshot => {
                const documents = querySnapshot.docs.map(doc => doc.data())
                // do something with documents
                for(var i = 0; i < documents.length; i++) {
                    var DeveloperID = documents[i]["Developer ID"];
                    var displayApp = `
                    <li>${documents[i].appName} with ${documents[i].Downloads} downloads</li>
                    <br>
                    <button class="download" onclick="onDownload('${DeveloperID}', '${age}', '${gender}', '${documents[i].appName}')"> Download </button>
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

function logout() {
    document.getElementById(`Notify`).innerHTML = "";
    document.getElementById(`apps`).innerHTML = "";
    document.getElementById('yourApps').innerHTML = "";
    firebase.auth().signOut().then(() => {
        // Sign-out successful.
      }).catch((error) => {
        // An error happened.
      });
}

function onDownload(DeveloperID, age, gender, appName) {
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