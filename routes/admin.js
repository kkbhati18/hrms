const express = require("express");
const router = express.Router();
const passport = require("passport");
const adminController = require("../controllers/adminController");
const { isLoggedIn } = require("./middleware");

router.use("/", isLoggedIn, function isAuthenticated(req, res, next) {
  next();
});

// Displays home page to the admin with dashboard statistics
router.get("/", adminController.viewHome);

/**
 * Sorts the list of employees in User Schema.
 * Such that latest records are shown first.
 * Then displays list of all employees to the admin.
 */
router.get("/view-all-employees", adminController.viewAllEmployees);

// Displays profile of the employee with the help of the id of the employee from the parameters.
router.get("/employee-profile/:id", adminController.viewEmployeeProfile);

// Displays the attendance sheet of the given employee to the admin.
router.get("/view-employee-attendance/:id", adminController.viewEmployeeAttendance);

// Displays edit employee form to the admin.
router.get("/edit-employee/:id", adminController.viewEditEmployeeForm);

// First it gets attributes of the logged in admin from the User Schema.
router.get("/view-profile", adminController.viewAdminProfile);

// Displays add employee form to the admin.
router.get("/add-employee", adminController.viewAddEmployeeForm);

/**
 * First it gets the id of the given employee from the parameters.
 * Finds the project of the employee from Project Schema with the help of that id.
 * Then displays all the projects of the given employee.
 */
router.get("/all-employee-projects/:id", adminController.viewAllEmployeeProjects);

// Displays the list of all the leave applications applied by all employees.
router.get("/leave-applications", adminController.viewLeaveApplications);

/**
 * Gets the leave id and employee id from the parameters.
 * Then shows the response application form of that leave of the employee to the admin.
 */
router.get(
  "/respond-application/:leave_id/:employee_id", adminController.viewRespondApplicationForm
);

/**
 * Gets id of the projet to be edit.
 * Displays the form of the edit project to th admin.
 */
router.get("/edit-employee-project/:id", adminController.viewEditEmployeeProjectForm);

/**
 * Gets the id of the employee from parameters.
 * Displays the add employee project form to the admin.
 */
router.get("/add-employee-project/:id", adminController.viewAddEmployeeProjectForm);

router.get("/employee-project-info/:id", adminController.viewEmployeeProjectInfo);

router.get("/redirect-employee-profile", adminController.redirectEmployeeProfile);

// Displays the admin its own attendance sheet
router.post("/view-attendance", adminController.viewAttendanceSheet);

/**
 * After marking attendance.
 * Shows current attendance to the admin.
 */
router.get("/view-attendance-current", adminController.viewCurrentAttendance);

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
router.post("/respond-application", adminController.respondApplication);

// Gets the id of the employee from the parameters.
// Gets the edited fields of the project from body of the post request.
// Saves the update field to the project of the employee  in Project Schema.
// Edits the project of the employee.
router.post("/edit-employee/:id", adminController.editEmployee);

router.post("/add-employee-project/:id", adminController.addEmployeeProject);

router.post("/edit-employee-project/:id", adminController.editEmployeeProject);

router.post("/delete-employee/:id", adminController.deleteEmployee);

router.post("/mark-attendance", adminController.markAttendance);

// --- Attendance management page ----------------------------------------------
router.get("/attendance", adminController.viewAttendanceManagement);

// --- View all projects --------------------------------------------------------
router.get("/view-all-projects", adminController.viewAllProjects);

// --- Add Project (standalone) -------------------------------------------------
router.get("/add-project", adminController.viewAddProjectStandaloneForm);

router.post("/add-project", adminController.addProjectStandalone);

// --- Holidays -----------------------------------------------------------------
router.get("/holidays", adminController.viewHolidays);

router.post("/holidays/add", adminController.addHoliday);

router.post("/holidays/delete/:id", adminController.deleteHoliday);

// --- Expense Claims -----------------------------------------------------------
router.get("/expense-claims", adminController.viewExpenseClaims);

router.post("/expense-claims/review/:id", adminController.reviewExpenseClaim);

// --- Recruitment --------------------------------------------------------------
router.get("/recruitment", adminController.viewRecruitment);

router.get("/recruitment/new", adminController.viewPostJobForm);

router.post("/recruitment/new", adminController.postJob);

router.post("/recruitment/update-status/:id", adminController.updateJobStatus);

router.get("/recruitment/:id", adminController.viewJobDetail);

router.post("/recruitment/:id/applicant-status/:appId", adminController.updateApplicantStatus);

module.exports = router;

