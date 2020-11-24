const express = require("express");
const { check } = require("express-validator");

const checkAuth = require("../middlewares/check-auth");
const hallControllers = require("../controllers/hall-controllers");

const router = express.Router();

router.get("/", hallControllers.getAllHalls);

router.get("/open/:id", hallControllers.getHallById);

router.use(checkAuth);

router.get("/mytickets/:id", hallControllers.getTicketsByUserID);

router.post("/newHall", hallControllers.createHall);

router.post("/bookTickets", hallControllers.bookTickets);

router.delete("/:id", hallControllers.deleteHall);

module.exports = router;
