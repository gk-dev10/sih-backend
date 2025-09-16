import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;


const bufferToStream = (buffer) => {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
};

export const uploadBufferToCloudinary = async (
  fileBuffer,
  filename,
  folder,
  resourceType = "auto" 
) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: `${Date.now()}-${filename.replace(/\.pdf$/, "")}`,
        resource_type: resourceType,
        ...(resourceType === "raw" ? { format: "pdf" } : {}), 
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          secure_url: result?.secure_url || "",
          public_id: result?.public_id || "",
        });
      }
    );

    bufferToStream(fileBuffer).pipe(uploadStream);
  });
};