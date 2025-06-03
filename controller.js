const { UserModal } = require("./model/userModel");
const { FileModel } = require("./model/file");
const AuditLog = require("./model/AuditLog");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const secretkey = "secretkey";  
const mongoose = require('mongoose');
const User = require('./model/userModel');





async function login(req, res) {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).send({ message: "Email and password required" });

        const user = await UserModal.findOne({ email });
        if (!user) return res.status(401).send({ message: "Invalid credentials" });

        // TODO: Add password hashing and compare here (bcrypt recommended)
        if (user.password !== password) {
            return res.status(401).send({ message: "Invalid credentials" });
        }

        const payload = { id: user._id, email: user.email, role: user.role || 'user' };
        const token = jwt.sign(payload, secretkey, { expiresIn: '1h' });

        res.json({
            message: "User logged in successfully",
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role }
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).send({ message: "Something went wrong" });
    }
}

// POST /signup - register new user and return token
async function signup(req, res) {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).send({ message: "All fields are required" });
        }

        const existingUser = await UserModal.findOne({ email });
        if (existingUser) {
            return res.status(409).send({ message: "User already exists" });
        }

        // TODO: Hash password before saving (recommended for production)
        const newUser = await UserModal.create({
            name,
            email,
            password,
            role: role || 'user' // take from body or default to 'user'
        });

        const payload = {
            id: newUser._id,
            email: newUser.email,
            role: newUser.role
        };

        const token = jwt.sign(payload, secretkey, { expiresIn: '1h' });

        res.status(201).json({
            message: "User registered successfully",
            token,
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role
            }
        });
    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
}

// POST /files/upload - Upload file
async function uploadFile(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const fileData = {
            filename: req.file.originalname,
            path: req.file.path,
            mimetype: req.file.mimetype,
            size: req.file.size,
            uploadedBy: req.user.id
        };

        const newFile = await FileModel.create(fileData);

        // After successful file upload, log audit:
        await AuditLog.create({
            user: req.user.id,
            action: 'UPLOAD',  // <-- use uppercase
            file: newFile._id,
            ipAddress: req.ip,
            details: `File uploaded: ${newFile.filename}`
        });


        res.status(200).json({
            message: "File uploaded successfully",
            file: newFile,
            url: `/files/${newFile._id}/download`
        });
    } catch (error) {
        console.error("File upload error:", error);
        res.status(500).json({ message: "File upload failed" });
    }
}



async function downloadFile(req, res) {
    try {
        const fileId = req.params.id;
        const fileDoc = await FileModel.findById(fileId);
        if (!fileDoc) {
            return res.status(404).json({ message: "File not found" });
        }

        const filePath = path.resolve(fileDoc.path);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: "File not found on server" });
        }

        await AuditLog.create({
            user: req.user.id,
            action: 'DOWNLOAD',
            file: fileDoc._id,
            ipAddress: req.ip,
            details: `File downloaded: ${fileDoc.filename}`
        });


        res.download(filePath, fileDoc.filename, (err) => {
            if (err && !res.headersSent) {
                res.status(500).json({ message: "Error while downloading file" });
            }
        });
    } catch (error) {
        console.error("Download error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}




async function getAuditLogs(req, res) {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Access denied" });
        }

        const logs = await AuditLog.find()
            .populate("user", "name email role")
            .populate("file", "filename")
            .sort({ timestamp: -1 });

        res.status(200).json({ logs });
    } catch (error) {
        console.error("Error fetching audit logs:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}



async function getOrgFiles(req, res) {
  try {
    const files = await FileModel.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'uploadedBy',
          foreignField: '_id',
          as: 'uploader'
        }
      },
      { $unwind: '$uploader' },
      {
        $project: {
          filename: 1,
          mimetype: 1,
          size: 1,
          path: 1,
          uploadedAt: '$createdAt',
          uploadedBy: {
            _id: '$uploader._id',
            name: '$uploader.name',
            email: '$uploader.email'
          }
        }
      }
    ]);

    res.json({ files });
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}


// GET /files/stats - Download stats grouped by file
async function getDownloadStats(req, res) {
  try {
    const stats = await AuditLog.aggregate([
      { $match: { action: 'DOWNLOAD' } },
      {
        $group: {
          _id: '$file',
          downloadCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'files',
          localField: '_id',
          foreignField: '_id',
          as: 'fileInfo'
        }
      },
      { $unwind: '$fileInfo' },
      {
        $project: {
          _id: 0,
          fileId: '$fileInfo._id',
          filename: '$fileInfo.filename',
          downloadCount: 1
        }
      },
      { $sort: { downloadCount: -1 } } // Optional: sort by most downloaded
    ]);

    res.status(200).json({ stats });
  } catch (error) {
    console.error('Error fetching download stats:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}


module.exports = {
  login,
  signup,
  uploadFile,
  downloadFile,
  getAuditLogs,
  getOrgFiles,
  getDownloadStats 
};

