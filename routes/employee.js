var express = require("express");
var router = express.Router();
var Leave = require("../models/leave");
var Attendance = require("../models/attendance");
var Project = require("../models/project");
var moment = require("moment");
var User = require("../models/user");
var Holiday = require("../models/holiday");
var ExpenseClaim = require("../models/expense_claim");

router.use("/", isLoggedIn, function checkAuthentication(req, res, next) {
  next();
});

/**
 * Displays home page to the employee with dashboard statistics.
 */
router.get("/", async function viewHome(req, res, next) {
  const today = new Date();
  try {
    const [leaveCount, pendingLeaves, projectCount, todayAttendance] = await Promise.all([
      Leave.countDocuments({ applicantID: req.user._id }),
      Leave.countDocuments({ applicantID: req.user._id, adminResponse: "N/A" }),
      Project.countDocuments({ employeeID: req.user._id }),
      Attendance.countDocuments({
        employeeID: req.user._id, present: true,
        date: today.getDate(), month: today.getMonth() + 1, year: today.getFullYear()
      }),
    ]);
    res.render("Employee/employeeHome", {
      title: "Dashboard",
      userName: req.user.name,
      csrfToken: req.csrfToken(),
      leaveCount, pendingLeaves, projectCount, todayAttendance,
    });
  } catch (err) {
    res.render("Employee/employeeHome", {
      title: "Dashboard",
      userName: req.user.name,
      csrfToken: req.csrfToken(),
      leaveCount: 0, pendingLeaves: 0, projectCount: 0, todayAttendance: 0,
    });
  }
});

/**
 * Displays leave application form to the user.
 */

router.get("/apply-for-leave", function applyForLeave(req, res, next) {
  res.render("Employee/applyForLeave", {
    title: "Apply for Leave",
    csrfToken: req.csrfToken(),
    userName: req.user.name,
  });
});

/**
 * Displays the list of all applied laves of the user.
 */

router.get("/applied-leaves", function viewAppliedLeaves(req, res, next) {
  var leaveChunks = [];

  //find is asynchronous function
  Leave.find({ applicantID: req.user._id })
    .sort({ _id: -1 })
    .exec(function getLeaves(err, docs) {
      var hasLeave = 0;
      if (docs.length > 0) {
        hasLeave = 1;
      }
      for (var i = 0; i < docs.length; i++) {
        leaveChunks.push(docs[i]);
      }

      res.render("Employee/appliedLeaves", {
        title: "List Of Applied Leaves",
        csrfToken: req.csrfToken(),
        hasLeave: hasLeave,
        leaves: leaveChunks,
        userName: req.user.name,
      });
    });
});

/**
 * Displays the attendance to the user.
 */

router.post("/view-attendance", function viewAttendanceSheet(req, res, next) {
  var attendanceChunks = [];
  Attendance.find({
    employeeID: req.user._id,
    month: req.body.month,
    year: req.body.year,
  })
    .sort({ _id: -1 })
    .exec(function getAttendance(err, docs) {
      var found = 0;
      if (docs.length > 0) {
        found = 1;
      }
      for (var i = 0; i < docs.length; i++) {
        attendanceChunks.push(docs[i]);
      }
      res.render("Employee/viewAttendance", {
        title: "Attendance Sheet",
        month: req.body.month,
        csrfToken: req.csrfToken(),
        found: found,
        attendance: attendanceChunks,
        moment: moment,
        userName: req.user.name,
      });
    });
});

/**
 * Display currently marked attendance to the user.
 */

router.get(
  "/view-attendance-current",
  function viewCurrentlyMarkedAttendance(req, res, next) {
    var attendanceChunks = [];

    Attendance.find({
      employeeID: req.user._id,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
    })
      .sort({ _id: -1 })
      .exec(function getAttendanceSheet(err, docs) {
        var found = 0;
        if (docs.length > 0) {
          found = 1;
        }
        for (var i = 0; i < docs.length; i++) {
          attendanceChunks.push(docs[i]);
        }
        res.render("Employee/viewAttendance", {
          title: "Attendance Sheet",
          month: new Date().getMonth() + 1,
          csrfToken: req.csrfToken(),
          found: found,
          attendance: attendanceChunks,
          moment: moment,
          userName: req.user.name,
        });
      });
  }
);

/**
 * Displays employee his/her profile.
 */

router.get("/view-profile", function viewProfile(req, res, next) {
  User.findById(req.user._id, function getUser(err, user) {
    if (err) {
      console.log(err);
    }
    res.render("Employee/viewProfile", {
      title: "Profile",
      csrfToken: req.csrfToken(),
      employee: user,
      moment: moment,
      userName: req.user.name,
    });
  });
});

/**
 * Displays the list of all the projects to the Project Schema.
 */

router.get("/view-all-projects", function viewAllProjects(req, res, next) {
  var projectChunks = [];
  Project.find({ employeeID: req.user._id })
    .sort({ _id: -1 })
    .exec(function getProjects(err, docs) {
      var hasProject = 0;
      if (docs.length > 0) {
        hasProject = 1;
      }
      for (var i = 0; i < docs.length; i++) {
        projectChunks.push(docs[i]);
      }
      res.render("Employee/viewPersonalProjects", {
        title: "List Of Projects",
        hasProject: hasProject,
        projects: projectChunks,
        csrfToken: req.csrfToken(),
        userName: req.user.name,
      });
    });
});

/**
 * Displays the employee his/her project infomation by
 * getting project id from the request parameters.
 */

router.get("/view-project/:project_id", function viewProject(req, res, next) {
  var projectId = req.params.project_id;
  Project.findById(projectId, function getProject(err, project) {
    if (err) {
      console.log(err);
    }
    res.render("Employee/viewProject", {
      title: "Project Details",
      project: project,
      csrfToken: req.csrfToken(),
      moment: moment,
      userName: req.user.name,
    });
  });
});

/**
 * Saves the applied leave application form in Leave Schema.
 */

router.post("/apply-for-leave", function applyForLeave(req, res, next) {
  var newLeave = new Leave();
  newLeave.applicantID = req.user._id;
  newLeave.title = req.body.title;
  newLeave.type = req.body.type;
  newLeave.startDate = new Date(req.body.start_date);
  newLeave.endDate = new Date(req.body.end_date);
  newLeave.period = req.body.period;
  newLeave.reason = req.body.reason;
  newLeave.appliedDate = new Date();
  newLeave.adminResponse = "Pending";
  newLeave.save(function saveLeave(err) {
    if (err) {
      console.log(err);
    }
    res.redirect("/employee/applied-leaves");
  });
});

/**
 * Marks the attendance of the employee in Attendance Schema
 */

router.post(
  "/mark-employee-attendance",
  function markEmployeeAttendance(req, res, next) {
    Attendance.find(
      {
        employeeID: req.user._id,
        month: new Date().getMonth() + 1,
        date: new Date().getDate(),
        year: new Date().getFullYear(),
      },
      function getAttendanceSheet(err, docs) {
        var found = 0;
        if (docs.length > 0) {
          found = 1;
        } else {
          var newAttendance = new Attendance();
          newAttendance.employeeID = req.user._id;
          newAttendance.year = new Date().getFullYear();
          newAttendance.month = new Date().getMonth() + 1;
          newAttendance.date = new Date().getDate();
          newAttendance.present = 1;
          newAttendance.save(function saveAttendance(err) {
            if (err) {
              console.log(err);
            }
          });
        }
        res.redirect("/employee/view-attendance-current");
      }
    );
  }
);
// ─── Attendance page (GET with date picker) ────────────────────────────────
router.get("/attendance", async (req, res) => {
  const { month, year } = req.query;
  const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;
  const currentYear = year ? parseInt(year) : new Date().getFullYear();
  try {
    const attendance = await Attendance.find({
      employeeID: req.user._id,
      month: currentMonth,
      year: currentYear,
    }).sort({ date: 1 });
    res.render("Employee/viewAttendance", {
      title: "My Attendance",
      csrfToken: req.csrfToken(),
      userName: req.user.name,
      attendance,
      found: attendance.length > 0 ? 1 : 0,
      month: currentMonth,
      moment,
    });
  } catch (err) {
    res.redirect("/employee/");
  }
});

// ─── Expense Claims ──────────────────────────────────────────────────────────
router.get("/expenses", async (req, res) => {
  try {
    const claims = await ExpenseClaim.find({ employeeID: req.user._id }).sort({ _id: -1 });
    res.render("Employee/expenses", {
      title: "Expense Claims",
      csrfToken: req.csrfToken(),
      userName: req.user.name,
      claims,
      moment,
    });
  } catch (err) {
    res.redirect("/employee/");
  }
});

router.get("/expenses/new", (req, res) => {
  res.render("Employee/expenseNew", {
    title: "File Expense Claim",
    csrfToken: req.csrfToken(),
    userName: req.user.name,
    error: req.flash("error"),
  });
});

router.post("/expenses/new", async (req, res) => {
  const { title, category, amount, expenseDate, description } = req.body;
  try {
    await new ExpenseClaim({
      employeeID: req.user._id,
      title, category, amount, expenseDate, description,
    }).save();
    res.redirect("/employee/expenses");
  } catch (err) {
    req.flash("error", "Failed to submit claim.");
    res.redirect("/employee/expenses/new");
  }
});

module.exports = router;

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/");
}
