import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "text/plain",
      "image/jpg",
      "application/octet-stream",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, TXT, and OCTET-STREAM are allowed"), false);
    }
  },
});

export default upload;