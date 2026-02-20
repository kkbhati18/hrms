const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("../models/user");
const Project = require("../models/project");
const config_passport = require("../config/passport.js");
const moment = require("moment");
const Leave = require("../models/leave");
const Attendance = require("../models/attendance");
const Holiday = require("../models/holiday");
const ExpenseClaim = require("../models/expense_claim");
const Recruitment = require("../models/recruitment");
const { isLoggedIn } = require("./middleware");

router.use("/", isLoggedIn, function isAuthenticated(req, res, next) {
  next();
});

// Displays home page to the admin with dashboard statistics
router.get("/", async function viewHome(req, res, next) {
  try {
    const today = new Date();
    const [totalEmployees, pendingLeaves, totalProjects, todayAttendance, recentEmployees] = await Promise.all([
      User.countDocuments({ type: { $in: ["employee", "project_manager", "accounts_manager"] } }),
      Leave.countDocuments({ adminResponse: "N/A" }),
      Project.countDocuments(),
      Attendance.countDocuments({ present: true, date: today.getDate(), month: today.getMonth() + 1, year: today.getFullYear() }),
      User.find({ type: { $in: ["employee", "project_manager", "accounts_manager"] } }).sort({ _id: -1 }).limit(5),
    ]);
    res.render("Admin/adminHome", {
      title: "Dashboard",
      csrfToken: req.csrfToken(),
      userName: req.user.name,
      totalEmployees,
      pendingLeaves,
      totalProjects,
      todayAttendance,
      recentEmployees,
      moment,
    });
  } catch (err) {
    console.error(err);
    res.render("Admin/adminHome", {
      title: "Dashboard",
      csrfToken: req.csrfToken(),
      userName: req.user.name,
      totalEmployees: 0, pendingLeaves: 0, totalProjects: 0, todayAttendance: 0, recentEmployees: [], moment,
    });
  }
});

/**
 * Sorts the list of employees in User Schema.
 * Such that latest records are shown first.
 * Then displays list of all employees to the admin.
 */
router.get("/view-all-employees", async (req, res, next) => {
  try {
    const users = await User.find({
      $or: [
        { type: "employee" },
        { type: "project_manager" },
        { type: "accounts_manager" },
      ],
    }).sort({ _id: -1 });

    res.render("Admin/viewAllEmployee", {
      title: "All Employees",
      csrfToken: req.csrfToken(),
      users,
      userName: req.user.name,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error retrieving employees");
  }
});

// Displays profile of the employee with the help of the id of the employee from the parameters.
router.get("/employee-profile/:id", async (req, res, next) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    res.render("Admin/employeeProfile", {
      title: "Employee Profile",
      employee: user,
      csrfToken: req.csrfToken(),
      moment: moment,
      userName: req.user.name,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error retrieving employee profile");
  }
});

// Displays the attendance sheet of the given employee to the admin.
router.get("/view-employee-attendance/:id", async (req, res, next) => {
  const { id } = req.params;
  try {
    const attendances = await Attendance.find({ employeeID: id }).sort({
      _id: -1,
    });
    const user = await User.findById(id);

    res.render("Admin/employeeAttendanceSheet", {
      title: "Employee Attendance Sheet",
      month: req.body.month,
      csrfToken: req.csrfToken(),
      found: attendances.length > 0 ? 1 : 0,
      attendance: attendances,
      moment: moment,
      userName: req.user.name,
      employee_name: user.name,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error retrieving employee attendance");
  }
});

// Displays edit employee form to the admin.
router.get("/edit-employee/:id", async (req, res, next) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    res.render("Admin/editEmployee", {
      title: "Edit Employee",
      csrfToken: req.csrfToken(),
      employee: user,
      moment: moment,
      message: "",
      userName: req.user.name,
    });
  } catch (err) {
    console.error(err);
    res.redirect("/admin/");
  }
});

// First it gets attributes of the logged in admin from the User Schema.
router.get("/view-profile", async (req, res, next) => {
  const { _id, name } = req.user;
  try {
    const user = await User.findById(_id);
    res.render("Admin/viewProfile", {
      title: "Profile",
      csrfToken: req.csrfToken(),
      employee: user,
      moment: moment,
      userName: name,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error retrieving profile");
  }
});

// Displays add employee form to the admin.
router.get("/add-employee", (req, res, next) => {
  const { name } = req.user;
  const messages = req.flash("error");

  res.render("Admin/addEmployee", {
    title: "Add Employee",
    csrfToken: req.csrfToken(),
    user: config_passport.User,
    messages,
    hasErrors: messages.length > 0,
    userName: name,
  });
});

/**
 * First it gets the id of the given employee from the parameters.
 * Finds the project of the employee from Project Schema with the help of that id.
 * Then displays all the projects of the given employee.
 */
router.get("/all-employee-projects/:id", async (req, res, next) => {
  const { id } = req.params;
  try {
    const projects = await Project.find({ employeeID: id }).sort({ _id: -1 });
    const user = await User.findById(id);

    res.render("Admin/employeeAllProjects", {
      title: "List Of Employee Projects",
      hasProject: projects.length > 0 ? 1 : 0,
      projects,
      csrfToken: req.csrfToken(),
      user,
      userName: req.user.name,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error retrieving employee projects");
  }
});

// Displays the list of all the leave applications applied by all employees.
router.get("/leave-applications", async (req, res, next) => {
  try {
    const leaves = await Leave.find({}).sort({ _id: -1 });
    const hasLeave = leaves.length > 0 ? 1 : 0;

    const employeeChunks = await Promise.all(
      leaves.map((leave) => User.findById(leave.applicantID))
    );

    res.render("Admin/allApplications", {
      title: "List Of Leave Applications",
      csrfToken: req.csrfToken(),
      hasLeave,
      leaves,
      employees: employeeChunks,
      moment: moment,
      userName: req.user.name,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error retrieving leave applications");
  }
});

/**
 * Gets the leave id and employee id from the parameters.
 * Then shows the response application form of that leave of the employee to the admin.
 */
router.get(
  "/respond-application/:leave_id/:employee_id",
  async (req, res, next) => {
    const { leave_id: leaveID, employee_id: employeeID } = req.params;
    try {
      const leave = await Leave.findById(leaveID);
      const user = await User.findById(employeeID);

      res.render("Admin/applicationResponse", {
        title: "Respond Leave Application",
        csrfToken: req.csrfToken(),
        leave,
        employee: user,
        moment: moment,
        userName: req.user.name,
      });
    } catch (err) {
      console.error(err);
      res.status(500).send("Error responding to application");
    }
  }
);

/**
 * Gets id of the projet to be edit.
 * Displays the form of the edit project to th admin.
 */
router.get("/edit-employee-project/:id", async (req, res, next) => {
  const { id } = req.params;
  try {
    const project = await Project.findById(id);
    res.render("Admin/editProject", {
      title: "Edit Employee",
      csrfToken: req.csrfToken(),
      project,
      moment: moment,
      message: "",
      userName: req.user.name,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error retrieving project");
  }
});

/**
 * Gets the id of the employee from parameters.
 * Displays the add employee project form to the admin.
 */
router.get("/add-employee-project/:id", async (req, res, next) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    res.render("Admin/addProject", {
      title: "Add Employee Project",
      csrfToken: req.csrfToken(),
      employee: user,
      moment: moment,
      message: "",
      userName: req.user.name,
    });
  } catch (err) {
    res.redirect("/admin/");
  }
});

router.get("/employee-project-info/:id", async (req, res, next) => {
  const { id } = req.params;
  try {
    const project = await Project.findById(id);
    const user = await User.findById(project.employeeID);
    res.render("Admin/projectInfo", {
      title: "Employee Project Information",
      project: project,
      employee: user,
      moment: moment,
      message: "",
      userName: req.user.name,
      csrfToken: req.csrfToken(),
    });
  } catch (err) {
    console.log(err);
  }
});

router.get("/redirect-employee-profile", async (req, res, next) => {
  const { id } = req.user;
  try {
    const user = await User.findById(id);
    res.redirect(`/admin/employee-profile/${id}`);
  } catch (err) {
    console.log(err);
  }
});

// Displays the admin its own attendance sheet
router.post("/view-attendance", async (req, res, next) => {
  const { month, year } = req.body;
  const { _id, name } = req.user;
  try {
    const attendance = await Attendance.find({
      employeeID: _id,
      month,
      year,
    }).sort({ _id: -1 });
    const found = attendance.length > 0 ? 1 : 0;
    res.render("Admin/viewAttendanceSheet", {
      title: "Attendance Sheet",
      month,
      csrfToken: req.csrfToken(),
      found,
      attendance,
      userName: name,
      moment: moment,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error viewing attendance");
  }
});

/**
 * After marking attendance.
 * Shows current attendance to the admin.
 */
router.get("/view-attendance-current", async (req, res, next) => {
  const { _id, name } = req.user;
  const month = new Date().getMonth() + 1;
  const year = new Date().getFullYear();
  try {
    const attendance = await Attendance.find({
      employeeID: _id,
      month,
      year,
    }).sort({ _id: -1 });
    const found = attendance.length > 0 ? 1 : 0;
    res.render("Admin/viewAttendanceSheet", {
      title: "Attendance Sheet",
      month,
      csrfToken: req.csrfToken(),
      found,
      attendance,
      moment: moment,
      userName: name,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error viewing current attendance");
  }
});

// Adds employee to the User Schema by getting attributes from the body of the post request.
// Then redirects admin to the profile information page of the added employee.
router.post(
  "/add-employee",
  passport.authenticate("local.add-employee", {
    successRedirect: "/admin/redirect-employee-profile",
    failureRedirect: "/admin/add-employee",
    failureFlash: true,
  })
);

// Gets the id of the leave from the body of the post request.
// Sets the response field of that leave according to response given by employee from body of the post request.
router.post("/respond-application", async (req, res) => {
  try {
    const leave = await Leave.findById(req.body.leave_id);
    leave.adminResponse = req.body.status;
    await leave.save();
    res.redirect("/admin/leave-applications");
  } catch (err) {
    console.log(err);
  }
});

// Gets the id of the employee from the parameters.
// Gets the edited fields of the project from body of the post request.
// Saves the update field to the project of the employee  in Project Schema.
// Edits the project of the employee.
router.post("/edit-employee/:id", async (req, res) => {
  const { id } = req.params;
  const { email, designation, name, DOB, number, department, skills } =
    req.body;
  const newUser = {
    email,
    type:
      designation === "Accounts Manager"
        ? "accounts_manager"
        : designation === "Project Manager"
        ? "project_manager"
        : "employee",
    name,
    dateOfBirth: new Date(DOB),
    contactNumber: number,
    department,
    Skills: skills,
    designation,
  };

  try {
    const user = await User.findById(id);
    if (user.email !== email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.render("Admin/editEmployee", {
          title: "Edit Employee",
          csrfToken: req.csrfToken(),
          employee: newUser,
          moment: moment,
          message: "Email is already in use",
          userName: req.user.name,
        });
      }
    }
    Object.assign(user, newUser);
    await user.save();
    res.redirect(`/admin/employee-profile/${id}`);
  } catch (err) {
    console.log(err);
    res.redirect("/admin/");
  }
});

router.post("/add-employee-project/:id", async (req, res) => {
  const { id } = req.params;
  const { title, type, start_date, end_date, description, status } = req.body;
  const newProject = new Project({
    employeeID: id,
    title,
    type,
    startDate: new Date(start_date),
    endDate: new Date(end_date),
    description,
    status,
  });

  try {
    await newProject.save();
    res.redirect(`/admin/employee-project-info/${newProject._id}`);
  } catch (err) {
    console.log(err);
  }
});

router.post("/edit-employee-project/:id", async (req, res) => {
  const { id } = req.params;
  const { title, type, start_date, end_date, description, status } = req.body;

  try {
    const project = await Project.findById(id);
    project.title = title;
    project.type = type;
    project.startDate = new Date(start_date);
    project.endDate = new Date(end_date);
    project.description = description;
    project.status = status;
    await project.save();
    res.redirect(`/admin/employee-project-info/${id}`);
  } catch (err) {
    console.log(err);
  }
});

router.post("/delete-employee/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await User.findByIdAndRemove(id);
    res.redirect("/admin/view-all-employees");
  } catch (err) {
    console.log("unable to delete employee");
  }
});

router.post("/mark-attendance", async (req, res) => {
  const { _id } = req.user;
  const currentDate = new Date();
  const date = currentDate.getDate();
  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();

  try {
    const attendance = await Attendance.find({
      employeeID: _id,
      date,
      month,
      year,
    });

    if (attendance.length === 0) {
      const newAttendance = new Attendance({
        employeeID: _id,
        year,
        month,
        date,
        present: 1,
      });
      await newAttendance.save();
    }

    res.redirect("/admin/view-attendance-current");
  } catch (err) {
    console.log(err);
  }
});

// ─── Attendance management page ──────────────────────────────────────────────
router.get("/attendance", async (req, res) => {
  const today = new Date();
  try {
    const employees = await User.find({
      type: { $in: ["employee", "project_manager", "accounts_manager"] },
    }).sort({ name: 1 });
    const todayAttendance = await Attendance.find({
      date: today.getDate(), month: today.getMonth() + 1, year: today.getFullYear(),
    });
    const markedIds = new Set(todayAttendance.map((a) => a.employeeID.toString()));
    res.render("Admin/attendanceManage", {
      title: "Attendance Management",
      csrfToken: req.csrfToken(),
      userName: req.user.name,
      employees,
      markedIds,
      todayDate: moment(today).format("DD MMMM YYYY"),
      moment,
    });
  } catch (err) {
    console.error(err);
    res.redirect("/admin/");
  }
});

// ─── View all projects ────────────────────────────────────────────────────────
router.get("/view-all-projects", async (req, res) => {
  try {
    const projects = await Project.find({}).sort({ _id: -1 });
    const enriched = await Promise.all(
      projects.map(async (p) => {
        const emp = await User.findById(p.employeeID).catch(() => null);
        return { project: p, employee: emp };
      })
    );
    res.render("Admin/viewAllProjects", {
      title: "All Projects",
      csrfToken: req.csrfToken(),
      userName: req.user.name,
      projects: enriched,
      moment,
    });
  } catch (err) {
    console.error(err);
    res.redirect("/admin/");
  }
});

// ─── Add Project (standalone) ─────────────────────────────────────────────────
router.get("/add-project", async (req, res) => {
  try {
    const employees = await User.find({ type: { $in: ["employee", "project_manager"] } });
    res.render("Admin/addProjectStandalone", {
      title: "Add Project",
      csrfToken: req.csrfToken(),
      userName: req.user.name,
      employees,
    });
  } catch (err) {
    res.redirect("/admin/view-all-projects");
  }
});

router.post("/add-project", async (req, res) => {
  const { employeeID, title, type, start_date, end_date, description, status } = req.body;
  try {
    await new Project({ employeeID, title, type, startDate: start_date, endDate: end_date, description, status }).save();
    res.redirect("/admin/view-all-projects");
  } catch (err) {
    console.error(err);
    res.redirect("/admin/add-project");
  }
});

// ─── Holidays ─────────────────────────────────────────────────────────────────
router.get("/holidays", async (req, res) => {
  try {
    const holidays = await Holiday.find({}).sort({ date: 1 });
    res.render("Admin/holidays", {
      title: "Holiday Management",
      csrfToken: req.csrfToken(),
      userName: req.user.name,
      holidays,
      moment,
    });
  } catch (err) {
    console.error(err);
    res.redirect("/admin/");
  }
});

router.post("/holidays/add", async (req, res) => {
  const { name, date, type, description } = req.body;
  try {
    await new Holiday({ name, date, type, description, createdBy: req.user._id }).save();
    res.redirect("/admin/holidays");
  } catch (err) {
    console.error(err);
    res.redirect("/admin/holidays");
  }
});

router.post("/holidays/delete/:id", async (req, res) => {
  try {
    await Holiday.findByIdAndRemove(req.params.id);
    res.redirect("/admin/holidays");
  } catch (err) {
    res.redirect("/admin/holidays");
  }
});

// ─── Expense Claims ───────────────────────────────────────────────────────────
router.get("/expense-claims", async (req, res) => {
  try {
    const claims = await ExpenseClaim.find({}).sort({ _id: -1 });
    const enriched = await Promise.all(
      claims.map(async (c) => ({
        claim: c,
        employee: await User.findById(c.employeeID).catch(() => null),
      }))
    );
    res.render("Admin/expenseClaims", {
      title: "Expense Claims",
      csrfToken: req.csrfToken(),
      userName: req.user.name,
      claims: enriched,
      moment,
    });
  } catch (err) {
    console.error(err);
    res.redirect("/admin/");
  }
});

router.post("/expense-claims/review/:id", async (req, res) => {
  try {
    const claim = await ExpenseClaim.findById(req.params.id);
    claim.status = req.body.status;
    claim.reviewNote = req.body.reviewNote || "";
    claim.reviewedBy = req.user._id;
    claim.reviewedAt = new Date();
    await claim.save();
    res.redirect("/admin/expense-claims");
  } catch (err) {
    res.redirect("/admin/expense-claims");
  }
});

// ─── Recruitment ──────────────────────────────────────────────────────────────
router.get("/recruitment", async (req, res) => {
  try {
    const jobs = await Recruitment.find({}).sort({ _id: -1 });
    res.render("Admin/recruitment", {
      title: "Recruitment",
      csrfToken: req.csrfToken(),
      userName: req.user.name,
      jobs,
      moment,
    });
  } catch (err) {
    console.error(err);
    res.redirect("/admin/");
  }
});

router.get("/recruitment/new", (req, res) => {
  res.render("Admin/recruitmentNew", {
    title: "Post Job",
    csrfToken: req.csrfToken(),
    userName: req.user.name,
  });
});

router.post("/recruitment/new", async (req, res) => {
  const { title, department, jobDescription, requirements, openings, type, experienceRequired, closingDate } = req.body;
  try {
    await new Recruitment({ title, department, jobDescription, requirements, openings, type, experienceRequired, closingDate, postedBy: req.user._id }).save();
    res.redirect("/admin/recruitment");
  } catch (err) {
    console.error(err);
    res.redirect("/admin/recruitment/new");
  }
});

router.post("/recruitment/update-status/:id", async (req, res) => {
  try {
    await Recruitment.findByIdAndUpdate(req.params.id, { status: req.body.status });
    res.redirect("/admin/recruitment");
  } catch (err) {
    res.redirect("/admin/recruitment");
  }
});

router.get("/recruitment/:id", async (req, res) => {
  try {
    const job = await Recruitment.findById(req.params.id);
    res.render("Admin/recruitmentDetail", {
      title: job.title,
      csrfToken: req.csrfToken(),
      userName: req.user.name,
      job,
      moment,
    });
  } catch (err) {
    res.redirect("/admin/recruitment");
  }
});

router.post("/recruitment/:id/applicant-status/:appId", async (req, res) => {
  try {
    const job = await Recruitment.findById(req.params.id);
    const applicant = job.applicants.id(req.params.appId);
    if (applicant) { applicant.status = req.body.status; await job.save(); }
    res.redirect(`/admin/recruitment/${req.params.id}`);
  } catch (err) {
    res.redirect("/admin/recruitment");
  }
});

module.exports = router;
