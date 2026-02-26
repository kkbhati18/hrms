const express = require("express");
const router = express.Router();
const employeeController = require("../controllers/employeeController");
const { isLoggedIn } = require("./middleware");

router.use("/", isLoggedIn, function checkAuthentication(req, res, next) {
  next();
});

/**
 * Displays home page to the employee with dashboard statistics.
 */
router.get("/", employeeController.viewHome);

/**
 * Displays leave application form to the user.
 */
router.get("/apply-for-leave", employeeController.viewApplyForLeaveForm);

/**
 * Displays the list of all applied leaves of the user.
 */
router.get("/applied-leaves", employeeController.viewAppliedLeaves);

/**
 * Displays the attendance to the user.
 */
router.post("/view-attendance", employeeController.viewAttendanceSheet);

/**
 * Display currently marked attendance to the user.
 */
router.get("/view-attendance-current", employeeController.viewCurrentlyMarkedAttendance);

/**
 * Displays employee his/her profile.
 */
router.get("/view-profile", employeeController.viewProfile);

/**
 * Displays the list of all the projects to the Project Schema.
 */
router.get("/view-all-projects", employeeController.viewAllProjects);

/**
 * Displays the employee his/her project information by
 * getting project id from the request parameters.
 */
router.get("/view-project/:project_id", employeeController.viewProjectDetail);

/**
 * Saves the applied leave application form in Leave Schema.
 */
router.post("/apply-for-leave", employeeController.applyForLeave);

/**
 * Marks the attendance of the employee in Attendance Schema
 */
router.post("/mark-employee-attendance", employeeController.markEmployeeAttendance);

// --- Attendance page (GET with date picker) --------------------------------
router.get("/attendance", employeeController.viewAttendanceWithQuery);

// --- Expense Claims ----------------------------------------------------------
router.get("/expenses", employeeController.viewExpenses);

router.get("/expenses/new", employeeController.viewFileExpenseClaimForm);

router.post("/expenses/new", employeeController.postExpenseClaim);

module.exports = router;

