const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const DEPARTMENTS = [
  'Roads Department',
  'Sanitation Department',
  'Water Supply Department',
  'Electrical Department',
  'Municipal Administration',
  'Emergency Response Unit',
];

const userSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['citizen', 'authority'],
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
    },
    profilePicture: {
      type: String,
      default: '',
    },

    // Citizen Specific Fields
    phoneNumber: {
      type: String,
      trim: true,
      default: '',
    },

    // Authority Specific Fields
    employeeId: {
      type: String,
      sparse: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    officialEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    department: {
      type: String,
      enum: DEPARTMENTS,
    },
    designation: {
      type: String,
      trim: true,
      default: '',
    },
    wardRegion: {
      type: String,
      trim: true,
      default: '',
    },
    isVerifiedAuthority: {
      type: Boolean,
      default: false,
    },
    badge: {
      type: String,
      default: 'Citizen',
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before save
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = { User, DEPARTMENTS };
