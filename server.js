const express = require("express");
const path = require("path");
const exphbs = require("express-handlebars");
const data = require("./modules/collegeData.js");
const clientSessions = require("client-sessions");

const app = express();

const HTTP_PORT = process.env.PORT || 8080;

const user = {
  username: "sampleuser",
  password: "samplepassword",
  email: "sampleuser@example.com",
};

function ensureLogin(req, res, next) {
  if (!req.session.user) {
    res.redirect("/login");
  } else {
    next();
  }
}
app.use(express.urlencoded({ extended: true }));

app.use(
  clientSessions({
    cookieName: "session", // this is the object name that will be added to 'req'
    secret: "week10example_web322", // this should be a long un-guessable string.
    duration: 2 * 60 * 1000, // duration of the session in milliseconds (2 minutes)
    activeDuration: 1000 * 60, // the session will be extended by this many ms each request (1 minute)
  })
);

app.use(function (req, res, next) {
  let route = req.baseUrl + req.path;
  app.locals.activeRoute = route == "/" ? "/" : route.replace(/\/$/, "");
  next();
});

app.engine(
  ".hbs",
  exphbs.engine({
    defaultLayout: "main",
    extname: ".hbs",
    helpers: {
      navLink: function (url, options) {
        return (
          "<li" +
          (url == app.locals.activeRoute
            ? ' class="nav-item active" '
            : ' class="nav-item" ') +
          '><a class="nav-link" href="' +
          url +
          '">' +
          options.fn(this) +
          "</a></li>"
        );
      },
      equal: function (lvalue, rvalue, options) {
        if (arguments.length < 3)
          throw new Error("Handlebars Helper equal needs 2 parameters");
        if (lvalue != rvalue) {
          return options.inverse(this);
        } else {
          return options.fn(this);
        }
      },
    },
  })
);

app.set("view engine", ".hbs");

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.render("login");
});

app.get("/login", (req, res) => {
  res.render("login");
});

// The login route that adds the user to the session
app.post("/login", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  if (username === "" || password === "") {
    // Render 'missing credentials'
    return res.render("login", {
      errorMsg: "Missing credentials.",
      layout: false, // do not use the default Layout (main.hbs)
    });
  }

  // use sample "user" (declared above)
  if (username === user.username && password === user.password) {
    // Add the user on the session and redirect them to the dashboard page.
    req.session.user = {
      username: user.username,
      email: user.email,
    };
    req.session.loggedIn = true;

    res.redirect("/dashboard");
  } else {
    // render 'invalid username or password'
    res.render("login", {
      errorMsg: "invalid username or password!",
    });
  }
});

app.get("/logout", (req, res) => {
  req.session.reset();
  req.session.loggedIn = false;
  res.redirect("/login");
});

// An authenticated route that requires the user to be logged in.
// Notice the middleware 'ensureLogin' that comes before the function
// that renders the dashboard page
app.get("/dashboard", ensureLogin, (req, res) => {
  res.render("dashboard", {
    user: req.session.user,
    session: req.session,
  });
});

app.get("/about", ensureLogin, (req, res) => {
  res.render("about");
});

app.get("/home", ensureLogin, (req, res) => {
  res.render("dashboard");
});

app.get("/htmlDemo", ensureLogin, (req, res) => {
  res.render("htmlDemo");
});

app.get("/students", ensureLogin, (req, res) => {
  if (req.query.course) {
    data
      .getStudentsByCourse(req.query.course)
      .then((data) => {
        if (data.length > 0) {
          res.render("students", { students: data });
        } else {
          res.render("students", { message: "no results" });
        }
      })
      .catch((err) => {
        res.render("students", {
          message: "Error: Could not fetch students by course.",
        });
      });
  } else {
    data
      .getAllStudents()
      .then((data) => {
        if (data.length > 0) {
          res.render("students", { students: data });
        } else {
          res.render("students", { message: "no results" });
        }
      })
      .catch((err) => {
        res.render("students", {
          message: "Error: Could not fetch all students.",
        });
      });
  }
});

app.get("/students/add", ensureLogin, (req, res) => {
  data
    .getCourses()
    .then((courses) => {
      res.render("addStudent", { courses: courses });
    })
    .catch(() => {
      res.render("addStudent", { courses: [] });
    });
});

app.post("/students/add", ensureLogin, (req, res) => {
  data.addStudent(req.body).then(() => {
    res.redirect("/students");
  });
});

app.get("/courses/add", ensureLogin, (req, res) => {
  res.render("addCourse");
});

app.post("/courses/add", ensureLogin, (req, res) => {
  data.addCourse(req.body).then(() => {
    res.redirect("/courses");
  });
});

app.get("/student/:studentNum", ensureLogin, (req, res) => {
  // initialize an empty object to store the values
  let viewData = {};

  data
    .getStudentsByNum(req.params.studentNum)
    .then((data) => {
      if (data) {
        viewData.student = data; // store student data in the "viewData" object as "student"
      } else {
        viewData.student = null; // set student to null if none were returned
      }
    })
    .catch(() => {
      viewData.student = null; // set student to null if there was an error
    })
    .then(() => data.getCourses())
    .then((data) => {
      viewData.courses = data; // store course data in the "viewData" object as "courses"
      // loop through viewData.courses and once we have found the courseId that matches
      // the student's "course" value, add a "selected" property to the matching
      // viewData.courses object
      for (let i = 0; i < viewData.courses.length; i++) {
        if (viewData.courses[i].courseId == viewData.student.course) {
          viewData.courses[i].selected = true;
        }
      }
    })
    .catch(() => {
      viewData.courses = []; // set courses to empty if there was an error
    })
    .then(() => {
      if (viewData.student == null) {
        // if no student - return an error
        res.status(404).send("Student Not Found");
      } else {
        res.render("student", { viewData: viewData }); // render the "student" view
      }
    });
});

app.post("/student/update", ensureLogin, (req, res) => {
  data.updateStudent(req.body).then(() => {
    res.redirect("/students");
  });
});

app.get("/courses", ensureLogin, (req, res) => {
  data
    .getCourses()
    .then((data) => {
      if (data.length > 0) {
        res.render("courses", { courses: data });
      } else {
        res.render("courses", { message: "no results" });
      }
    })
    .catch((err) => {
      res.render("courses", { message: "Error: Could not fetch courses." });
    });
});

app.get("/course/:id", ensureLogin, (req, res) => {
  data
    .getCourseById(req.params.id)
    .then((data) => {
      if (!data) {
        res.status(404).send("Course Not Found");
      } else {
        res.render("course", { course: data });
      }
    })
    .catch((err) => {
      res.render("course", { message: "no results" });
    });
});

app.get("/course/delete/:id", ensureLogin, (req, res) => {
  data
    .deleteCourseById(req.params.id)
    .then(() => {
      res.redirect("/courses");
    })
    .catch((err) => {
      console.error("Error deleting course:", err);
      res.status(500).send("Unable to remove course");
    });
});

app.get("/student/delete/:studentNum", ensureLogin, (req, res) => {
  data
    .deleteStudentByNum(req.params.studentNum)
    .then(() => {
      res.redirect("/students");
    })
    .catch((err) => {
      console.error("Error deleting student:", err);
      res.status(500).send("Unable to remove student");
    });
});

app.use((req, res) => {
  res.status(404).send("Page Not Found");
});

data
  .initialize()
  .then(function () {
    app.listen(HTTP_PORT, function () {
      console.log("app listening on: " + HTTP_PORT);
    });
  })
  .catch(function (err) {
    console.log("unable to start server: " + err);
  });
