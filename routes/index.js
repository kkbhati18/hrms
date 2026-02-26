const express = require("express");
const router = express.Router();
const passport = require("passport");
const indexController = require("../controllers/indexController");
const { isLoggedIn } = require("./middleware");
const csrf = require("csurf");
const csrfProtection = csrf();
router.use(csrfProtection);

router.get("/", indexController.viewLoginPage);

router.post(
  "/login",
  passport.authenticate("local.signin", {
    successRedirect: "/check-type",
    failureRedirect: "/",
    failureFlash: true,
  })
);

router.get("/check-type", indexController.checkTypeOfLoggedInUser);

router.get("/logout", isLoggedIn, indexController.logoutUser);

router.get("/signup", indexController.viewSignUpPage);

router.post(
  "/signup",
  passport.authenticate("local.signup", {
    successRedirect: "/signup",
    failureRedirect: "/signup",
    failureFlash: true,
  })
);

router.get("/dummy", indexController.dummyView);

module.exports = router;
