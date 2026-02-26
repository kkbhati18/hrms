const User = require("../models/user");
const UserSalary = require("../models/user_salary");
const PaySlip = require("../models/payslip");
const Leave = require("../models/leave");
const Attendance = require("../models/attendance");
const moment = require("moment");
const Project = require("../models/project");
const PerformanceAppraisal = require("../models/performance_appraisal");

exports.viewHome = async (req, res, next) => {
  try {
    const today = new Date();
    const [teamCount, pendingLeaves, projectCount, appraisalCount] = await Promise.all([
      User.countDocuments({ type: "employee" }),
      Leave.countDocuments({ adminResponse: "N/A" }),
      Project.countDocuments({ employeeID: req.user._id }),
      PerformanceAppraisal.countDocuments({ projectManagerID: req.user._id }),
    ]);
    const userRole = req.user.type === "project_manager" ? "Project Manager" : "Accounts Manager";
    res.render("Manager/managerHome", {
      title: "Dashboard",
      csrfToken: req.csrfToken(),
      userName: req.user.name,
      userRole, teamCount, pendingLeaves, projectCount, appraisalCount,
    });
  } catch (err) {
    const userRole = req.user.type === "project_manager" ? "Project Manager" : "Accounts Manager";
    res.render("Manager/managerHome", {
      title: "Dashboard",
      csrfToken: req.csrfToken(),
      userName: req.user.name,
      userRole, teamCount: 0, pendingLeaves: 0, projectCount: 0, appraisalCount: 0,
    });
  }
};

exports.viewEmployees = async (req, res) => {
  if (req.user.type === "project_manager") {
    try {
      const users = await User.find({ type: "employee" }).sort({ _id: -1 });
      res.render("Manager/viewemp_project", {
        title: "List Of Employees",
        csrfToken: req.csrfToken(),
        users,
        errors: 0,
        userName: req.user.name,
      });
    } catch (err) {
      console.log(err);
      res.redirect("/manager/");
    }
  } else if (req.user.type === "accounts_manager") {
    try {
      const users = await User.find({ $or: [{ type: "employee" }, { type: "project_manager" }] }).sort({ _id: -1 });
      const salaryChunks = await Promise.all(users.map(async (user) => {
        let salary = await UserSalary.findOne({ employeeID: user._id });
        if (!salary) {
          salary = new UserSalary({
            accountManagerID: req.user._id,
            employeeID: user._id
          });
          await salary.save();
        }
        return salary;
      }));
      res.render("Manager/viewemp_accountant", {
        title: "List Of Employees",
        csrfToken: req.csrfToken(),
        users,
        salary: salaryChunks,
        userName: req.user.name,
      });
    } catch (err) {
      console.log(err);
      res.redirect("/manager/");
    }
  }
};

exports.viewAllEmployeeSkills = (req, res, next) => {
  var employeeId = req.params.id;
  User.findById(employeeId, function getUser(err, user) {
    if (err) {
      console.log(err);
    }
    res.render("Manager/employeeSkills", {
      title: "List Of Employee Skills",
      employee: user,
      moment: moment,
      csrfToken: req.csrfToken(),
      userName: req.user.name,
    });
  });
};

exports.viewAllEmployeeProjects = (req, res, next) => {
  var employeeId = req.params.id;
  Project.find({ employeeID: employeeId })
    .sort({ _id: -1 })
    .exec(function getProject(err, docs) {
      var hasProject = docs.length > 0 ? 1 : 0;
      User.findById(employeeId, function getUser(err, user) {
        if (err) {
          console.log(err);
        }
        res.render("Manager/employeeAllProjects", {
          title: "List Of Employee Projects",
          hasProject: hasProject,
          projects: docs,
          csrfToken: req.csrfToken(),
          user: user,
          userName: req.user.name,
        });
      });
    });
};

exports.viewEmployeeProjectInfo = (req, res, next) => {
  var projectId = req.params.id;
  Project.findById(projectId, function getProject(err, project) {
    if (err) {
      console.log(err);
    }
    User.findById(project.employeeID, function getUser(err, user) {
      if (err) {
        console.log(err);
      }
      res.render("Manager/projectInfo", {
        title: "Employee Project Information",
        project: project,
        employee: user,
        moment: moment,
        csrfToken: req.csrfToken(),
        message: "",
        userName: req.user.name,
      });
    });
  });
};

exports.viewProvidePerformanceAppraisalForm = (req, res, next) => {
  var employeeId = req.params.id;
  PerformanceAppraisal.find(
    { employeeID: employeeId },
    function getPerformanceAppraisal(err, pa) {
      if (pa.length > 0) {
        User.find({ type: "employee" }, function getUser(err, docs) {
          res.render("Manager/viewemp_project", {
            title: "List Of Employees",
            csrfToken: req.csrfToken(),
            users: docs,
            errors: 1,
            userName: req.user.name,
          });
        });
      } else {
        User.findById(employeeId, function getUser(err, user) {
          if (err) {
            console.log(err);
          }
          res.render("Manager/performance_appraisal", {
            title: "Provide Performance Appraisal",
            csrfToken: req.csrfToken(),
            employee: user,
            moment: moment,
            message: "",
            userName: req.user.name,
          });
        });
      }
    }
  );
};

exports.viewCurrentMarkedAttendance = (req, res, next) => {
  Attendance.find({
    employeeID: req.user._id,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  })
    .sort({ _id: -1 })
    .exec(function getAttendanceSheet(err, docs) {
      var found = docs.length > 0 ? 1 : 0;
      res.render("Manager/viewAttendance", {
        title: "Attendance Sheet",
        month: new Date().getMonth() + 1,
        csrfToken: req.csrfToken(),
        found: found,
        attendance: docs,
        moment: moment,
        userName: req.user.name,
      });
    });
};

exports.viewApplyForLeaveForm = (req, res, next) => {
  res.render("Manager/managerApplyForLeave", {
    title: "Apply for Leave",
    csrfToken: req.csrfToken(),
    userName: req.user.name,
  });
};

exports.viewAppliedLeaves = (req, res, next) => {
  Leave.find({ applicantID: req.user._id })
    .sort({ _id: -1 })
    .exec(function getLeave(err, docs) {
      var hasLeave = docs.length > 0 ? 1 : 0;
      res.render("Manager/managerAppliedLeaves", {
        title: "List Of Applied Leaves",
        csrfToken: req.csrfToken(),
        hasLeave: hasLeave,
        leaves: docs,
        userName: req.user.name,
      });
    });
};

exports.viewProfile = (req, res, next) => {
  User.findById(req.user._id, function getUser(err, user) {
    if (err) {
      console.log(err);
    }
    res.render("Manager/viewManagerProfile", {
      title: "Profile",
      csrfToken: req.csrfToken(),
      employee: user,
      moment: moment,
      userName: req.user.name,
    });
  });
};

exports.viewProjectDetail = (req, res, next) => {
  var projectId = req.params.project_id;
  Project.findById(projectId, function getProject(err, project) {
    if (err) {
      console.log(err);
    }
    res.render("Manager/viewManagerProject", {
      title: "Project Details",
      project: project,
      csrfToken: req.csrfToken(),
      moment: moment,
      userName: req.user.name,
    });
  });
};

exports.viewAllPersonalProjects = (req, res, next) => {
  Project.find({ employeeID: req.user._id })
    .sort({ _id: -1 })
    .exec(function getProject(err, docs) {
      var hasProject = docs.length > 0 ? 1 : 0;
      res.render("Manager/viewManagerPersonalProjects", {
        title: "List Of Projects",
        hasProject: hasProject,
        projects: docs,
        csrfToken: req.csrfToken(),
        userName: req.user.name,
      });
    });
};

exports.viewGeneratePaySlipForm = (req, res, next) => {
  var employeeId = req.params.employee_id;
  User.findById(employeeId, function getUser(err, user) {
    if (err) {
      console.log(err);
    }
    PaySlip.findOne({ employeeID: employeeId }, async function getPaySlip(err, doc) {
      var pay_slip;
      var hasPaySlip = 0;
      if (doc) {
        hasPaySlip = 1;
        pay_slip = doc;
      } else {
        pay_slip = new PaySlip({
          accountManagerID: req.user._id,
          employeeID: employeeId,
          bankName: "abc",
          branchAddress: "abc",
          basicPay: 0,
          overtime: 0,
          conveyanceAllowance: 0,
        });
        await pay_slip.save();
      }
      res.render("Manager/generatePaySlip", {
        title: "Generate Pay Slip",
        csrfToken: req.csrfToken(),
        employee: user,
        pay_slip: pay_slip,
        moment: moment,
        hasPaySlip: hasPaySlip,
        userName: req.user.name,
      });
    });
  });
};

exports.applyForLeave = (req, res, next) => {
  var newLeave = new Leave({
    applicantID: req.user._id,
    title: req.body.title,
    type: req.body.type,
    startDate: new Date(req.body.start_date),
    endDate: new Date(req.body.end_date),
    period: req.body.period,
    reason: req.body.reason,
    appliedDate: new Date(),
    adminResponse: "Pending"
  });
  newLeave.save(function saveLeave(err) {
    if (err) {
      console.log(err);
    }
    res.redirect("/manager/applied-leaves");
  });
};

exports.setBonus = (req, res) => {
  UserSalary.findOne(
    { employeeID: req.body.employee_bonus },
    function getUser(err, us) {
      if (err) {
        console.log(err);
      }
      us.bonus = req.body.bonus;
      us.reason = req.body.reason;
      us.save(function saveUserSalary(err) {
        if (err) {
          console.log(err);
        }
        res.redirect("/manager/view-employees");
      });
    }
  );
};

exports.setSalary = (req, res) => {
  var employee_id = req.body.employee_salary;
  UserSalary.findOne({ employeeID: employee_id }, function (err, us) {
    if (err) {
      console.log(err);
    }
    us.salary = Number(req.body.salary);
    us.save(function setUserSalary(err) {
      if (err) {
        console.log(err);
      }
      res.redirect("/manager/view-employees");
    });
  });
};

exports.incrementSalary = (req, res) => {
  UserSalary.findOne(
    { employeeID: req.body.employee_increment },
    function getUserSalary(err, us) {
      if (err) {
        console.log(err);
      }
      us.salary =
        Number(req.body.current_salary) + Number(req.body.amount_increment);
      us.save(function saveUserSalary(err) {
        if (err) {
          console.log(err);
        }
        res.redirect("/manager/view-employees");
      });
    }
  );
};

exports.providePerformanceAppraisal = (req, res) => {
  var employeeId = req.body.employee_id;
  var newPerformanceAppraisal = new PerformanceAppraisal({
    employeeID: employeeId,
    projectManagerID: req.user._id,
    rating: req.body.performance_rating,
    positionExpertise: req.body.expertise,
    approachTowardsQualityOfWork: req.body.approach_quality,
    approachTowardsQuantityOfWork: req.body.approach_quantity,
    leadershipManagementSkills: req.body.lead_manage,
    communicationSkills: req.body.skills_com,
    commentsOnOverallPerformance: req.body.comments
  });
  newPerformanceAppraisal.save(function savePerformanceAppraisal(err) {
    if (err) {
      console.log(err);
    }
    res.redirect("/manager/view-employees");
  });
};

exports.generatePaySlip = (req, res) => {
  var employeeId = req.body.employee_id;
  PaySlip.findOne({ employeeID: employeeId }, function getPaySlip(err, doc) {
    if (err) {
      console.log(err);
    }
    doc.bankName = req.body.bname;
    doc.branchAddress = req.body.baddress;
    doc.basicPay = req.body.pay;
    doc.overtime = req.body.otime;
    doc.conveyanceAllowance = req.body.allowance;
    doc.save(function savePaySlip(err) {
      if (err) {
        console.log(err);
      }
      res.redirect("/manager/view-employees");
    });
  });
};

exports.viewAttendanceSheet = (req, res, next) => {
  Attendance.find({
    employeeID: req.user._id,
    month: req.body.month,
    year: req.body.year,
  })
    .sort({ _id: -1 })
    .exec(function getAttendanceSheet(err, docs) {
      var found = docs.length > 0 ? 1 : 0;
      res.render("Manager/viewAttendance", {
        title: "Attendance Sheet",
        month: req.body.month,
        csrfToken: req.csrfToken(),
        found: found,
        attendance: docs,
        moment: moment,
        userName: req.user.name,
      });
    });
};

exports.markManagerAttendance = (req, res, next) => {
  Attendance.find(
    {
      employeeID: req.user._id,
      date: new Date().getDate(),
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
    },
    function getAttendance(err, docs) {
      if (docs.length === 0) {
        var newAttendance = new Attendance({
          employeeID: req.user._id,
          year: new Date().getFullYear(),
          month: new Date().getMonth() + 1,
          date: new Date().getDate(),
          present: 1
        });
        newAttendance.save(function saveAttendance(err) {
          if (err) {
            console.log(err);
          }
        });
      }
      res.redirect("/manager/view-attendance-current");
    }
  );
};
