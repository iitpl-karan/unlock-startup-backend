const Pages = require("../models/pagesModel");

exports.getAllPages = async (req, res) => {
  try {
    const result = await Pages.find();
    return res.status(200).json(result);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Some server error occurred",
    });
  }
};



exports.addNewPage = async (req, res) => {
  try {
    const { title, content, slug, metatitle, metadescription, currentDate } = req.body;
    const metaimage = req.file;

    if(!title){
      return res.status(400).json({
        message: "title is required"
      })
    }

    const isPageAlreadyExist = await Pages.findOne({ slug });
    if (isPageAlreadyExist) {
      return res.status(409).json({
        message: "Page already exist in database",
      });
    }

    const newPage = new Pages({
      title: title,
      slug: slug,
      content: content,
      metatitle: metatitle,
      metadescription: metadescription,
      metaimage: metaimage ? metaimage.filename : "",
      createdAt: currentDate
    });
    const result = await newPage.save();
    if (result) {
      return res.status(200).json({
        message: "New Page has been added",
      });
    } else {
      return res.status(500).json({
        message: "Unable to add new page in database",
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Some server error occured",
    });
  }
};

exports.getPageDetails = async (req, res) => {
  const id = req.query.id
  const isAdmin = req.query.isAdmin

  if (isAdmin === true || isAdmin === 'true') {
    try {
      const result = await Pages.findById(id);
      return res.status(200).json(result);
    } catch (err) {
      console.log(err);
      res.status(500).json({
        message: "Some server error occurred",
      });
    }
  }
}

exports.getPageDetailsBySlugName = async (req, res) => {
  const slug = req.query.slug
  try {
    const result = await Pages.findOne({ slug });

    result.metaimage = result.metaimage ? `/uploads/${result.metaimage}` : ''

    return res.status(200).json({
      message: "success",
      page: result,
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Some server error occurred",
    });
  } 
}


exports.updatePageDetails = async (req, res) => {

  try {
    const { id, title, slug, content, metatitle, metadescription, currentDate, isAdmin } = req.body;
    const metaimage = req.file;

    if (isAdmin === true || isAdmin === 'true') {
      // Construct the update object with the fields to be updated
      const updateData = {};
      if (title) updateData.title = title;
      if (slug) updateData.slug = slug;
      if (content) updateData.content = content;
      if (metatitle) updateData.metatitle = metatitle;
      if (metadescription) updateData.metadescription = metadescription;
      if (metaimage) updateData.metaimage = metaimage.filename;
      if (currentDate) updateData.updatedAt = currentDate

      // Perform the update operation
      const result = await Pages.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      );

      if (result) {
        return res.status(200).json({
          message: "Page details have been updated",
        });
      } else {
        return res.status(404).json({
          message: "Page not found",
        });
      }
    } else {
      res.status(403).json({
        message: "Unauthorized User",
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Some server error occurred",
    });
  }
}


exports.toggleStatusOfPage = async (req, res) => {
  const { id, status, isAdmin } = req.body
  try {
    if (isAdmin === true || isAdmin === 'true') {

      const result = await Pages.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      );

      if (result) {
        return res.status(200).json({
          message: "Status has been changed",
        });
      } else {
        return res.status(404).json({
          message: "Page not found",
        });
      }
    } else {
      res.status(403).json({
        message: "Unauthorized User",
      });
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({
      message: "Some server error occurred",
    });
  }
}

exports.deletePage = async (req, res) => {
  const { id } = req.body;
  try {
    const result = await Pages.findByIdAndDelete(id);

    if (result) {
      return res.status(200).json({
        message: "Page has been deleted",
      });
    } else {
      return res.status(404).json({
        message: "Page not found",
      });
    }
  } catch (e) { 
    console.error(e);
    res.status(500).json({
      message: "Some server error occurred",
    });
  }
};