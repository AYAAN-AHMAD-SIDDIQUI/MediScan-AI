import dotenv from "dotenv";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

dotenv.config();

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

// ===============================
// REGISTER
// ===============================

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    // Check existing user
    const existingUser = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (existingUser) {
      return res.status(409).json({
        message: "User already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create User + Patient profile
    const user = await prisma.user.create({
      data: {
        name: name,
        email: email,
        password: hashedPassword,

        // Public registration always creates PATIENT
        role: "PATIENT",

        patient: {
          create: {},
        },
      },

      include: {
        patient: true,
      },
    });

    return res.status(201).json({
      message: "Patient registered successfully",

      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        patientId: user.patient.id,
      },
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// ===============================
// LOGIN
// ===============================

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check required fields
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    // User doesn't exist
    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Compare password
    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Create JWT
    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
      },

      process.env.JWT_SECRET,

      {
        expiresIn: "7d",
      }
    );

    // Send response
    return res.status(200).json({
      message: "Login successful",

      token: token,

      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};