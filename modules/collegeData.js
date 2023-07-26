const Sequelize = require("sequelize");

var sequelize = new Sequelize(
  "qsganugv",
  "qsganugv",
  "4FFJoAFhD6tuOkGdOWmieGdXJZXE_IZ0",
  {
    host: "stampy.db.elephantsql.com",
    dialect: "postgres",
    port: 5432,
    dialectOptions: {
      ssl: { rejectUnauthorized: false },
    },
    query: { raw: true },
  }
);

const Student = sequelize.define("Student", {
  studentNum: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  firstName: Sequelize.STRING,
  lastName: Sequelize.STRING,
  email: Sequelize.STRING,
  addressStreet: Sequelize.STRING,
  addressCity: Sequelize.STRING,
  addressProvince: Sequelize.STRING,
  TA: Sequelize.BOOLEAN,
  status: Sequelize.STRING,
});

const Course = sequelize.define("Course", {
  courseId: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  courseCode: Sequelize.STRING,
  courseDescription: Sequelize.STRING,
});

Course.hasMany(Student, { foreignKey: "course" });

module.exports.initialize = function () {
  return new Promise((resolve, reject) => {
    sequelize
      .sync()
      .then(() => {
        console.log("Connection successful.");
        resolve();
      })
      .catch(() => {
        console.error("Unable to sync the database.");
        reject("Unable to sync the database.");
        return;
      });
  });
};

module.exports.getAllStudents = function () {
  return new Promise((resolve, reject) => {
    Student.findAll()
      .then((data) => {
        resolve(data);
      })
      .catch((err) => {
        reject("no results returned");
        return;
      });
  });
};

module.exports.getCourses = function () {
  return new Promise((resolve, reject) => {
    Course.findAll()
      .then((data) => {
        resolve(data);
      })
      .catch((err) => {
        reject("no results returned");
        return;
      });
  });
};

module.exports.getStudentsByCourse = function (course) {
  return new Promise((resolve, reject) => {
    Student.findAll({
      where: { course: course },
    }).then((students) => {
      if (students.length === 0) {
        reject("no results returned");
        return;
      } else {
        resolve(students);
      }
    });
  });
};

module.exports.getStudentsByNum = function (num) {
  return new Promise((resolve, reject) => {
    Student.findAll({
      where: { studentNum: num },
    }).then((students) => {
      if (students.length === 0) {
        reject("no results returned");
        return;
      } else {
        resolve(students[0]);
      }
    });
  });
};

module.exports.getCourseById = function (id) {
  return new Promise((resolve, reject) => {
    Course.findAll({
      where: { courseId: id },
    }).then((courses) => {
      if (courses.length === 0) {
        reject("no results returned");
        return;
      } else {
        resolve(courses[0]);
      }
    });
  });
};

module.exports.addStudent = function (studentData) {
  return new Promise((resolve, reject) => {
    studentData.TA = studentData.TA ? true : false;
    for (let key in studentData) {
      if (studentData[key] === "") {
        studentData[key] = null;
      }
    }
    Student.create(studentData)
      .then(() => {
        resolve();
      })
      .catch((error) => {
        console.error("unable to add student", error);
        reject("unable to add student");
      });
  });
};

module.exports.addCourse = function (courseData) {
  return new Promise((resolve, reject) => {
    for (let key in courseData) {
      if (courseData[key] === "") {
        courseData[key] = null;
      }
    }
    Course.create(courseData)
      .then(() => {
        resolve();
      })
      .catch((error) => {
        console.error("unable to add course");
        reject("unable to add course");
      });
  });
};

module.exports.updateStudent = function (studentData) {
  return new Promise((resolve, reject) => {
    studentData.TA = studentData.TA ? true : false;
    for (let key in studentData) {
      if (studentData[key] === "") {
        studentData[key] = null;
      }
    }
    Student.update(studentData, {
      where: { studentNum: studentData.studentNum },
    })
      .then(() => {
        resolve();
      })
      .catch((error) => {
        console.error("unable to update student:", error);
        reject("unable to update student");
      });
  });
};

module.exports.updateCourse = function (courseData) {
  return new Promise((resolve, reject) => {
    for (let key in courseData) {
      if (courseData[key] === "") {
        courseData[key] = null;
      }
    }
    Course.update(courseData, {
      where: { courseData: courseData.courseId },
    })
      .then(() => {
        resolve();
      })
      .catch((error) => {
        console.error("unable to update course:");
        reject("unable to update course");
      });
  });
};

module.exports.deleteCourseById = function (id) {
  return new Promise((resolve, reject) => {
    Course.destroy({
      where: { courseId: id },
    })
      .then(() => {
        resolve();
      })
      .catch((error) => {
        console.error("unable to delete course:");
        reject("unable to delete course");
      });
  });
};

module.exports.deleteStudentByNum = function (studentNum) {
  return new Promise((resolve, reject) => {
    Student.destroy({
      where: { studentNum: studentNum },
    })
      .then(() => {
        resolve();
      })
      .catch((error) => {
        console.error("unable to delete student");
        reject("unable to delete student");
      });
  });
};
