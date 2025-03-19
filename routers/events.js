const express = require("express");
const router = express.Router();
const eventController = require('../controllers/events')
const { upload } = require("../helpers/multer");
const userAuth = require("../middlewares/userAuth");

router.post("/add-event", upload.fields([
  { name: 'thumbnailImage', maxCount: 1 },
  { name: 'coverImage', maxCount: 1 },
  { name: 'document1', maxCount: 1 },
  { name: 'document2', maxCount: 1 }
]), eventController.createEvent);

router.get("/get-all-events", eventController.getAllEventsWithUsers);

router.post("/get-all-events-filter", eventController.getAllEventsWithFilter);

router.get("/get-all-events-paginaion", eventController.getEventwithpagination);

router.get("/get-user-events-pagination", eventController.getUserEventwithpagination);

router.get("/get-event-details", eventController.getEventDetails);

router.patch("/update-event-details" , upload.fields([
  { name: 'thumbnailImage', maxCount: 1 },
  { name: 'coverImage', maxCount: 1 },
  { name: 'document1', maxCount: 1 },
  { name: 'document2', maxCount: 1 }
]),userAuth, eventController.updateEventDetails);

router.delete("/delete-event" , userAuth ,eventController.deleteEvent);

router.delete("/admin-delete-event" , userAuth ,eventController.deleteEventAdmin);

router.patch("/toggle-status", eventController.updateStatusOfEvent);

router.patch("/update-payment-status-of-event", eventController.updatePaymentStatusOfEvent);

router.post("/add-event-type", eventController.addeventype);

router.get("/get-event-type", eventController.getAlleventype);

router.post("/add-event-payment", eventController.makepaymnt);

router.post("/verify-add-event-payment", eventController.VerifyPayment);

router.post("/admin-verify-add-event-payment", eventController.AdminPay);


module.exports = router;
