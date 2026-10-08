const jwt = require('jsonwebtoken');
const { User, DEPARTMENTS } = require('../models/User');
const { JWT_SECRET } = require('../middleware/auth');

// Generate JWT token
const signToken = (id, role) => {
  return jwt.sign({ id, role }, JWT_SECRET, {
    expiresIn: '30d',
  });
};

// 1. Citizen Registration
exports.registerCitizen = async (req, res) => {
  try {
    const { name, email, phoneNumber, password, profilePicture } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    const citizen = await User.create({
      role: 'citizen',
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phoneNumber: phoneNumber || '',
      password,
      profilePicture: profilePicture || '',
      badge: 'Citizen',
    });

    const token = signToken(citizen._id, citizen.role);

    res.status(201).json({
      success: true,
      message: 'Citizen registered successfully',
      token,
      user: {
        id: citizen._id,
        role: citizen.role,
        name: citizen.name,
        email: citizen.email,
        phoneNumber: citizen.phoneNumber,
        badge: citizen.badge,
        profilePicture: citizen.profilePicture,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 2. Citizen Login (Email & Password)
exports.loginCitizen = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const citizen = await User.findOne({
      email: email.toLowerCase().trim(),
      role: 'citizen',
    });

    if (!citizen || !(await citizen.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid citizen credentials' });
    }

    const token = signToken(citizen._id, citizen.role);

    res.status(200).json({
      success: true,
      message: 'Citizen logged in successfully',
      token,
      user: {
        id: citizen._id,
        role: citizen.role,
        name: citizen.name,
        email: citizen.email,
        phoneNumber: citizen.phoneNumber,
        badge: citizen.badge,
        profilePicture: citizen.profilePicture,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 3. Authority Registration (Employee ID, Official Email, Department, Designation, Ward)
exports.registerAuthority = async (req, res) => {
  try {
    const {
      name,
      employeeId,
      officialEmail,
      department,
      designation,
      wardRegion,
      password,
      profilePicture,
    } = req.body;

    if (!name || !employeeId || !officialEmail || !department || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, employee ID, official email, department, and password are required',
      });
    }

    if (!DEPARTMENTS.includes(department)) {
      return res.status(400).json({
        success: false,
        message: `Department must be one of: ${DEPARTMENTS.join(', ')}`,
      });
    }

    const normalizedEmployeeId = employeeId.trim().toUpperCase();
    const normalizedEmail = officialEmail.trim().toLowerCase();

    // Check Employee ID or Email uniqueness
    const existingEmployee = await User.findOne({
      $or: [{ employeeId: normalizedEmployeeId }, { email: normalizedEmail }],
    });

    if (existingEmployee) {
      return res.status(400).json({
        success: false,
        message: 'An authority with this Employee ID or Official Email already exists',
      });
    }

    const authority = await User.create({
      role: 'authority',
      name: name.trim(),
      email: normalizedEmail,
      officialEmail: normalizedEmail,
      employeeId: normalizedEmployeeId,
      department,
      designation: designation || 'Municipal Officer',
      wardRegion: wardRegion || 'Ward 151, Koramangala',
      password,
      isVerifiedAuthority: true,
      badge: '🏛 Municipal Authority',
      profilePicture: profilePicture || '',
    });

    const token = signToken(authority._id, authority.role);

    res.status(201).json({
      success: true,
      message: 'Authority official registered successfully',
      token,
      user: {
        id: authority._id,
        role: authority.role,
        name: authority.name,
        employeeId: authority.employeeId,
        officialEmail: authority.officialEmail,
        department: authority.department,
        designation: authority.designation,
        wardRegion: authority.wardRegion,
        isVerifiedAuthority: authority.isVerifiedAuthority,
        badge: authority.badge,
        profilePicture: authority.profilePicture,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 4. Authority Login (Employee ID & Password)
exports.loginAuthority = async (req, res) => {
  try {
    const { employeeId, password } = req.body;

    if (!employeeId || !password) {
      return res.status(400).json({ success: false, message: 'Employee ID and password are required' });
    }

    const normalizedEmployeeId = employeeId.trim().toUpperCase();

    const authority = await User.findOne({
      employeeId: normalizedEmployeeId,
      role: 'authority',
    });

    if (!authority || !(await authority.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid official Employee ID or password' });
    }

    const token = signToken(authority._id, authority.role);

    res.status(200).json({
      success: true,
      message: 'Authority official verified and logged in',
      token,
      user: {
        id: authority._id,
        role: authority.role,
        name: authority.name,
        employeeId: authority.employeeId,
        officialEmail: authority.officialEmail,
        department: authority.department,
        designation: authority.designation,
        wardRegion: authority.wardRegion,
        isVerifiedAuthority: authority.isVerifiedAuthority,
        badge: authority.badge,
        profilePicture: authority.profilePicture,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 5. Get Current User Profile
exports.getMe = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
