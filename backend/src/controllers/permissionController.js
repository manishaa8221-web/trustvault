const Document = require("../models/Document");

const grantPermission = async (req, res) => {
  try {
    const { documentId, userId, access } = req.body;

    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({
        message: "Document not found",
      });
    }

    document.permissions.push({
      user: userId,
      access,
    });

    await document.save();

    res.status(200).json({
      message: "Permission Granted",
      document,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  grantPermission,
};