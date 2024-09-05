const checkRole = (role) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      //! console.log("Forbidden: User role:", req.user ? req.user.role : "none"); 
      return res.status(403).json({ message: "Forbidden: You don't have the required permissions." });
    }
    next();
  };
};

module.exports = checkRole;