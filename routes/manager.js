const express = require("express");
const router = express.Router();
const managerController = require("../controllers/managerController");
const { isLoggedIn } = require("./middleware");

router.use("/", isLoggedIn, function checkAuthentication(req, res, next) {
  next();
});

/**
 * Displays home to the manager with dashboard statistics
 */
router.get("/", managerController.viewHome);

/**
 * Checks which type of manager is logged in.
 * Displays the list of employees to the manager respectively.
 */
router.get("/view-employees", managerController.viewEmployees);

/**
 * Displays All the skills of the employee to the project manager.
 */
router.get("/all-employee-skills/:id", managerController.viewAllEmployeeSkills);

/**
 * Displays all the projects of the employee to the project manager
 */
router.get("/all-employee-projects/:id", managerController.viewAllEmployeeProjects);

/**
 * Displays employee project information to the project manager
 */
router.get("/employee-project-info/:id", managerController.viewEmployeeProjectInfo);

/**
 * Displays the performance appraisal form for the employee to the project manager.
 */
router.get("/provide-performance-appraisal/:id", managerController.viewProvidePerformanceAppraisalForm);

/**
 * Displays currently marked attendance to the manager.
 */
router.get("/view-attendance-current", managerController.viewCurrentMarkedAttendance);

/**
 * Displays leave application form for the manager to apply for leave
 */
router.get("/apply-for-leave", managerController.viewApplyForLeaveForm);

/**
 * Manager gets the list of all his/her applied leaves.
 */
router.get("/applied-leaves", managerController.viewAppliedLeaves);

/**
 * Displays logged in manager his/her profile.
 */
router.get("/view-profile", managerController.viewProfile);

/**
 * Gets the id of the project to be shown form request parameters.
 * Displays the project to the project manager.
 */
router.get("/view-project/:project_id", managerController.viewProjectDetail);

/**
 * Displays list of all the project managers project.
 */
router.get("/view-all-personal-projects", managerController.viewAllPersonalProjects);

/**
 * Checks if pay slip has already been generated.
 */
router.get("/generate-pay-slip/:employee_id", managerController.viewGeneratePaySlipForm);

/**
 * Reads the parameters from the body of the post request.
 * Then saves the applied leave to the leave schema.
 */
router.post("/apply-for-leave", managerController.applyForLeave);

/**
 * Sets the bonus of the selected employee in UserSalary Schema
 */
router.post("/set-bonus", managerController.setBonus);

/**
 * Sets the salary of the selected employee in UserSalary Schema
 */
router.post("/set-salary", managerController.setSalary);

/**
 * Sets the Incremented salary of the selected employee in UserSalary Schema
 */
router.post("/increment-salary", managerController.incrementSalary);

/**
 * Saves the performance appraisal of the employee
 */
router.post("/provide-performance-appraisal", managerController.providePerformanceAppraisal);

/**
 * Stores the Pay Slip of employee in PaySlip schema if not already stored
 */
router.post("/generate-pay-slip", managerController.generatePaySlip);

/**
 * Displays attendance to the manager for the given year and month.
 */
router.post("/view-attendance", managerController.viewAttendanceSheet);

/**
 * Marks the attendance of the manager in current date
 */
router.post("/mark-manager-attendance", managerController.markManagerAttendance);

module.exports = router;

