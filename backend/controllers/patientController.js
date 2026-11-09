import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

// ===============================
// GET MY PATIENT PROFILE
// ===============================

export const getMyProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const patient = await prisma.patient.findUnique({
      where: {
        userId: userId,
      },

      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!patient) {
      return res.status(404).json({
        message: "Patient profile not found",
      });
    }

    return res.status(200).json({
      message: "Patient profile fetched successfully",

      patient: {
        patientId: patient.id,
        name: patient.user.name,
        email: patient.user.email,
        role: patient.user.role,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        phone: patient.phone,
      },
    });
  } catch (error) {
    console.error("GET PATIENT PROFILE ERROR:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};