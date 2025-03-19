const multer = require('multer')

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/') 
    },
    filename: function (req, file, cb) {
        // Generate a unique filename with timestamp and original extension
        const fileExt = file.originalname.split('.').pop();
        const uniqueFileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}.${fileExt}`;
        cb(null, uniqueFileName);
    }
})

const upload = multer({ 
    storage: storage,
    //  limits: { fileSize: 100000000 } 
     limits: { fileSize: 100 * 1024 * 1024 }, // Limit to 100 MB
    
    })

module.exports = { upload }