const PORT = process.env.PORT || 5000
var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var path = require("path");
var mongoose = require("mongoose");
var flash = require("express-flash");
var session = require("express-session");
var bcrypt = require("bcryptjs");
var fs = require('fs');
require("dotenv").config();


// local storage library: lets you save data into a dir called scratch.  
// Could be useful since local storage can only be served and accessed from the frontend. 
// This way we can use the data later and keep track of what we are doing.
if (typeof localStorage === "undefined" || localStorage === null) {
  var LocalStorage = require('node-localstorage').LocalStorage;
  localStorage = new LocalStorage('./scratch');
}

app.use(flash());

app.use(bodyParser.urlencoded({ extended: true }));

//middleware
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

app.use(express.static(__dirname + '/assets'));

app.use(
  session({
    secret: "hasdflkjasfdpiuhwlkj",
    resave: false,
    saveUninitialized: true
  })
);

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true
});
mongoose.Promise = global.Promise;

var UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      unique: true,
      trim: true,
      required: [true, "Please fill in a valid email"],
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please fill a valid email address"
      ]
    },
    first_name: {
      type: String,
      minlength: [2, "First Name must be more than 2 chars"],
      required: [true, "First Name is required"]
    },
    last_name: {
      type: String,
      minlength: [2, "First Name must be more than 2 chars"],
      required: [true, "Last Name is required"]
    },
    password: {
      type: String,
      required: [true, "Password is required"]
    }
  },
  { timestamps: true }
);

mongoose.model("User", UserSchema);
var User = mongoose.model("User");


// Login-Reg 
app.get("/", function (req, res) {
  res.render("index");
});

// Landing Page
app.get("/home", function (req, res) {
  let userSession = req.session;
  console.log("++++ SESSION +++", userSession)

  res.render("main", { session: req.session });

});


app.post("/register", function (req, res) {
  console.log("POST DATA: ", req.body);
  const userInstance = new User(req.body);
  console.log(userInstance);

  bcrypt.hash(userInstance.password, 10, function (err, hash) {
    userInstance.password = hash;
    userInstance.save(function (err) {
      if (err) {
        console.log(err.errors);
      } else {
        res.redirect("/");
      }
    });
  });
});

app.post("/login", function (req, res) {
  console.log(" req.body: ", req.body);
  User.findOne({ email: req.body.email }, function (err, user) {
    if (err) {
      console.log("ERROR IN RETRIEVEING USER FOR LOGIN");
    } else if (user) {
      console.log("USER FOUND FOR LOGIN");
      bcrypt.compare(req.body.password, user.password, function (err, result) {
        if (err) {
          res.redirect("/");
        } else if (result) {
          req.session.user_id = user._id;
          req.session.user_email = user.email;
          req.session.user_fname = user.first_name;
          let x = user.email;
          let UserEmail = { x };
          localStorage.setItem("UEMAIL", JSON.stringify(x));
          console.log("%% x from LS %%%", UserEmail)
          res.redirect("/home");
        } else {
          res.redirect("/");
        }
      });
    } else {
      console.log("USER -NOT FOUND- FOR LOGIN");
      response.redirect("/");
    }
    console.log("FOUND USER!", user);
  });
});

app.get("/logout", function (req, res) {
  req.session.destroy();
  console.log("session should not be here", req.session);
  res.redirect("/");
});

// https.createServer(options, app).listen(443);

app.listen(PORT, () => console.log(`Listening on ${ PORT }`));

