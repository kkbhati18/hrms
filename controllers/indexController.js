const User = require("../models/user");

exports.viewLoginPage = (req, res, next) => {
  if (req.isAuthenticated()) {
    return res.redirect("/check-type");
  }

  const messages = req.flash("error");

  res.render("login", {
    title: "Log In",
    csrfToken: req.csrfToken(),
    messages: messages,
    hasErrors: messages.length > 0,
  });
};

exports.checkTypeOfLoggedInUser = (req, res, next) => {
  req.session.user = req.user;
  switch (req.user.type) {
    case "project_manager":
    case "accounts_manager":
      res.redirect("/manager/");
      break;
    case "employee":
      res.redirect("/employee/");
      break;
    default:
      res.redirect("/admin/");
  }
};

exports.logoutUser = (req, res, next) => {
  req.logout();
  res.redirect("/");
};

exports.viewSignUpPage = (req, res, next) => {
  const messages = req.flash("error");
  res.render("signup", {
    csrfToken: req.csrfToken(),
    messages: messages,
    hasErrors: messages.length > 0,
  });
};

exports.dummyView = async (req, res, next) => {
  try {
    const users = await User.find({ type: "employee" });
    res.render("dummy", { title: "Dummy", users });
  } catch (err) {
    console.log(err);
  }
};
