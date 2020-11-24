const { validationResult } = require("express-validator");
const mongoose = require("mongoose");

const Hall = require("../models/hall-model");
const User = require("../models/user-model");
const HttpError = require("../models/error-model");

const getAllHalls = async (req, res, next) => {
  let allHalls;
  try {
    allHalls = await Hall.find({});
  } catch (err) {
    const error = new HttpError(
      "Could not fetch at this moment, please try again",
      500
    );
  }
  res.status(200).json({ allHalls: allHalls });
};

const getHallById = async (req, res, next) => {
  let hallId = req.params.id;

  let hall;

  try {
    hall = await Hall.findById(hallId);
  } catch (err) {
    const error = new HttpError("Could not find a place with that id", 500);
    return next(error);
  }

  if (!hall) {
    const error = new HttpError("Could not find the requested place id", 404);
    return next(error);
  }
  res.json({ hall: hall });
};

const getTicketsByUserID = async (req, res, next) => {
  let userId = req.params.id;

  let userTickets;

  try {
    userTickets = await User.findById(userId);
  } catch (err) {
    const error = new HttpError(
      "Could not find the places by the requested creator id",
      500
    );
    return next(error);
  }

  // if(!places || places.length === 0) {     Before populate method
  if (!userTickets || userTickets.bookedSeats.length === 0) {
    const error = new HttpError(
      "Could not find the places for the requested user id",
      404
    );
    return next(error);
  }

  res.json({
    tickets: userTickets.bookedSeats,
  });
};

const createHall = async (req, res, next) => {
  //   const errors = validationResult(req); //returns an array about the data that generated the error

  //   if (!errors.isEmpty()) {
  //     const error = new HttpError(
  //       "Invalid input entered, please check the input",
  //       422
  //     );
  //     return next(error);
  //   }

  const { name, currentMovie, address, seats } = req.body;
  //   let coordinates;

  //   try {
  //     coordinates = await getCoordFromAddress(address);
  //   } catch (err) {
  //     return next(err);
  //   }

  const newHall = new Hall({
    name,
    currentMovie,
    address,
    // location: coordinates,
    seats,
  });

  let user;
  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    return next(new HttpError("Creating place failed, please try again", 500));
  }

  if (!user || req.userData.role !== "admin") {
    return next(new HttpError("Not authorized to create Hall", 404));
  }

  try {
    // const sess = await mongoose.startSession();
    // sess.startTransaction();
    await newHall.save();
    // user.places.push(newPlace: sess });
    // await sess.commitTransact); //mongoose push method -- it adds the id of the place to the user model
    // await user.save({ sessionion();
  } catch (err) {
    console.log(err);
    return next(new HttpError("Creating place failed", 500));
  }

  res.status(201).json({ hall: newHall });
};

const bookTickets = async (req, res, next) => {
  const { hallId, bookedTickets } = req.body;
  const userId = req.userData.userId;
  //   console.log(hallId, bookedTickets[0].row);
  let selectedHall;

  try {
    selectedHall = await Hall.findById(hallId);
  } catch (err) {
    const error = new HttpError("Could not find the hall", 422);
    return next(error);
  }

  if (!selectedHall) {
    const error = new HttpError("Hall with the given id doesnt exist", 422);
    return next(error);
  }

  let existingUser;

  try {
    existingUser = await User.findById(userId);
  } catch (err) {
    const error = new HttpError("something went wrong", 500);
    return next(error);
  }

  for (let i = 0; i < selectedHall.seats.length; i++) {
    for (let j = 0; j < selectedHall.seats[i].length; j++) {
      for (let k = 0; k < bookedTickets.length; k++) {
        if (bookedTickets[k].row == i && bookedTickets[k].col == j) {
          if (!selectedHall.seats[i][j].isAvailable) {
            const error = new HttpError(
              "Seat is currently not avilable for booking",
              422
            );
            return next(error);
          }
          selectedHall.updateOne(
            {
              // _id: mongoose.Types.ObjectId(hallId),
              seats: [{ $elemMatch: { row: { $eq: i }, col: { $eq: j } } }],
            },
            {
              $set: {
                "seats.$.isAvailable": false,
                "seats.$.bookedBy": existingUser._id,
              },
            },
            (err, raw) => {
              console.log(err, raw);
            }
          );

          //   await Hall.updateOne(
          //     {},
          //     {
          //       $set: { "seats.$[row].isAvailable": false },
          //     },
          //     {
          //       arrayFilters: [{ row: { $eq: i }, col: { $eq: j } }],
          //     },
          //     (err, raw) => {
          //       console.log(err, raw);
          //     }
          //   );

          //   await Hall.updateOne(
          //     {
          //       _id: mongoose.Types.ObjectId(hallId),
          //       seats: { $elemMatch: { row: { $eq: i }, col: { $eq: j } } },
          //     },
          //     {
          //       $set: {
          //         "seats.$.isAvailable": false,
          //         "seats.$.bookedBy": existingUser._id,
          //       },
          //     },
          //     (err, raw) => {
          //       console.log(err, raw);
          //     }
          //   );

          //   selectedHall.seats[i][j].isAvailable = false;
          //   selectedHall.seats[i][j].bookedBy = existingUser._id;

          existingUser.bookedSeats.push({
            hallName: selectedHall._id,
            bookedSeat: {
              row: i,
              col: j,
            },
          });
          break;
        }
      }
    }
  }

  try {
    // const sess = await mongoose.startSession();
    // sess.startTransaction();
    // await selectedHall.remove();
    let res = await selectedHall.save();
    await existingUser.save();
    // await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError("Could not save right now", 500);
    console.log(err);
    return next(error);
  }

  res.status(200).json({
    hall: selectedHall,
  });
};

const deleteHall = async (req, res, next) => {
  const hallId = req.params.id;

  let hall;
  try {
    // await Place.deleteOne({ _id: placeId}, err => console.log(err));
    hall = await Hall.findById(hallId);
  } catch (err) {
    const error = new HttpError("Something went wrong, could not delete", 500);
    return next(error);
  }

  if (!hall) {
    return next(new HttpError("Could not find hall for this id", 404));
  }

  if (req.userData.role !== "admin") {
    const error = new HttpError(
      "You are not authorized to delete this place",
      401
    );
    return next(error);
  }

  try {
    await hall.remove();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete place",
      500
    );
    return next(error);
  }

  res.status(200).json({ message: "deleted successfully" });
};

exports.getAllHalls = getAllHalls;
exports.getHallById = getHallById;
exports.createHall = createHall;
exports.bookTickets = bookTickets;
exports.deleteHall = deleteHall;
exports.getTicketsByUserID = getTicketsByUserID;
