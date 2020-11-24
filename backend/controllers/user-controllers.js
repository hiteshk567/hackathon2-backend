const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const HttpError = require("../models/error-model");
const User = require("../models/user-model");

const signup = async (req, res, next) => {
  const errors = validationResult(req);
  console.log(req.body);
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(new HttpError("Please enter valid information", 422));
  }

  const { name, email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError("Signup failed, try again later", 500);
    return next(error);
  }

  if (existingUser) {
    const error = new HttpError("User already exist, instead login", 422);
    return next(error);
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    return next(new HttpError("Could not create user, please try again", 500));
  }

  let userRole = email === "hiteshk567@gmail.com" ? "admin" : "user";

  const newUser = new User({
    name,
    email,
    password: hashedPassword,
    role: userRole,
    bookedSeats: [],
  });

  try {
    await newUser.save();
  } catch (err) {
    const error = new HttpError("Signing up failed, please try again", 500);
    return next(error);
  }

  let token;

  try {
    token = jwt.sign(
      { userId: newUser.id, email: newUser.email, role: newUser.role },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );
  } catch (err) {
    const error = new HttpError("Signing up failed, please try again", 500);
    return next(error);
  }

  res.status(201).json({
    userId: newUser.id,
    email: newUser.email,
    token: token,
    role: newUser.role,
  });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError("Logging in failed, try again later", 500);
    return next(error);
  }

  if (!existingUser) {
    const error = new HttpError("Invalid credentials", 403);
    return next(error);
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    return next(
      new HttpError("Could not log you in, please check your credentials", 500)
    );
  }

  if (!isValidPassword) {
    const error = new HttpError("Invalid credentials", 403);
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      {
        userId: existingUser.id,
        email: existingUser.email,
        role: existingUser.role,
      },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );
  } catch (err) {
    const error = new HttpError("Logging in failed, please try again", 500);
    return next(error);
  }

  res.json({
    userId: existingUser.id,
    email: existingUser.email,
    token: token,
    role: existingUser.role,
  });
};

exports.signup = signup;
exports.login = login;
