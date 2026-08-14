const express = require("express");
const { getBrokerOverview, updateInvoiceSettings } = require("../controllers/brokerPortalDashboardController");
const { requireBrokerAuth } = require("../middleware/requireBrokerAuth");

const router = express.Router();

router.get("/overview", getBrokerOverview);
router.patch("/invoice-settings", requireBrokerAuth, updateInvoiceSettings);

module.exports = router;
