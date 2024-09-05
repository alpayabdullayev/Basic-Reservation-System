const userModel = require("../model/user.model");


const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log(req.user._id);
    
    console.log("User ID from request:", userId);
    const findUser = await userModel
      .findById(userId)
    if (!findUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(findUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


module.exports = { getCurrentUser };