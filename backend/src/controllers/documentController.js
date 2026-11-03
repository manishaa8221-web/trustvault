const Document = require("../models/Document");

const createDocument = async (req, res) => {
  try {
    const { title, content, owner } = req.body;

    const document = await Document.create({
      title,
      content,
      owner,
    });

    res.status(201).json(document);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  createDocument,
};