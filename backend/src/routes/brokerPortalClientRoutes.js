const express = require("express");
const {
  listBrokerClients,
  getBrokerClient,
  createBrokerClient,
  updateBrokerClient,
  uploadCustomerDocument,
  getCustomerKycPreview,
  generateCustomerKyc,
} = require("../controllers/brokerPortalClientController");
const { customerDocumentUpload } = require("../config/upload");

const router = express.Router();
const mongoose = require("mongoose");
const recycleBin = require("../controllers/clientRecycleBinController");
router.param("clientId", (req, res, next, value) => {
  if (!mongoose.isObjectIdOrHexString(value)) return res.status(400).json({ message: "Invalid client ID." });
  next();
});
router.get("/recycle-bin", recycleBin.listDeletedClients);
router.delete("/:clientId/soft-delete", recycleBin.softDeleteClient);
router.patch("/:clientId/restore", recycleBin.restoreClient);
router.delete("/:clientId/permanent-delete", recycleBin.permanentDeleteClient);

router.get("/", listBrokerClients);
router.post("/", createBrokerClient);
router.post("/:clientId/documents/:documentType", customerDocumentUpload.single("file"), uploadCustomerDocument);
router.get("/:clientId/kyc-preview", getCustomerKycPreview);
router.post("/:clientId/generate-kyc", generateCustomerKyc);
router.get("/:clientId", getBrokerClient);
router.patch("/:clientId", updateBrokerClient);

module.exports = router;
