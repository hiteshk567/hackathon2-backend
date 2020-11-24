const express = require("express");
const { check } = require("express-validator");

const usersControllers = require("../controllers/user-controllers");

const router = express.Router();

router.post(
  "/signup",
  [
    check("email").normalizeEmail().isEmail(), //HITESH@gmail.com == hitesh@gmail.com
    check("password").isLength({ min: 6 }),
    check("name").not().isEmpty(),
  ],
  usersControllers.signup
);

router.post("/login", usersControllers.login);

module.exports = router;
